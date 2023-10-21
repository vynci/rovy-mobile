import { useEffect, useRef } from "react";
import { store, view } from "@risingstack/react-easy-state";

import {
  KinesisVideoClient,
  DescribeSignalingChannelCommand,
  GetSignalingChannelEndpointCommand,
} from "@aws-sdk/client-kinesis-video";

import {
  KinesisVideoSignalingClient,
  GetIceServerConfigCommand,
} from "@aws-sdk/client-kinesis-video-signaling";

import { SignalingClient } from "amazon-kinesis-video-streams-webrtc";

const OPTIONS = {
  TRAVERSAL: {
    STUN_TURN: "stunTurn",
    TURN_ONLY: "turnOnly",
    DISABLED: "disabled",
  },
  ROLE: {
    MASTER: "MASTER",
    VIEWER: "VIEWER",
  },
};

const state: any = store({
  accessKey: process.env.AWS_ROVY_KEY,
  secretAccessKey: process.env.AWS_ROVY_SECRET,
  sessionToken: "",
  region: process.env.AWS_ROVY_REGION,
  role: OPTIONS.ROLE.VIEWER,
  channelName: "test-stream",
  clientId: getRandomClientId(),
  endpoint: null,
  natTraversal: OPTIONS.TRAVERSAL.STUN_TURN,
  useTrickleICE: true,
  playerIsStarted: false,
  signalingClient: null,
  remoteView: null,
  peerConnectionStatsInterval: null,
  peerConnectionByClientId: {},
});

let setStatus: any;

const KinesisWebRTC = view(({ setKvsStatus }) => {
  state.remoteView = useRef(null);
  setStatus = setKvsStatus;

  useEffect(() => {
    startPlayer();
  }, []);

  return <>{state.playerIsStarted ? <VideoPlayers /> : null}</>;
});

//------------------------------------------------------------------------------
const VideoPlayers = view(() => {
  return (
    <>
      <div id="video-players">
        <video
          style={{
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
            position: "fixed",
            top: 0,
            left: 0,
          }}
          ref={state.remoteView}
          autoPlay
          playsInline
          muted
        />
      </div>
    </>
  );
});

//------------------------------------------------------------------------------
function startPlayer() {
  state.playerIsStarted = true;
  console.log(`role is '${state.role}'`);

  startPlayerForViewer();
}

//------------------------------------------------------------------------------
async function startPlayerForViewer() {
  const kinesisVideoClient = new KinesisVideoClient({
    region: state.region,
    endpoint: state.endpoint || null,
    credentials: {
      accessKeyId: state.accessKey,
      secretAccessKey: state.secretAccessKey,
    },
  });

  const describeSignalingChannelCommand = new DescribeSignalingChannelCommand({
    ChannelName: state.channelName,
  });

  const describeSignalingChannelResponse: any = await kinesisVideoClient.send(
    describeSignalingChannelCommand
  );

  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
  console.log("[VIEWER] Channel ARN: ", channelARN);

  const getSignalingChannelEndpointResponseCommand =
    new GetSignalingChannelEndpointCommand({
      ChannelARN: channelARN,
      SingleMasterChannelEndpointConfiguration: {
        Protocols: ["WSS", "HTTPS"],
        Role: state.role, //roleOption.MASTER
      },
    });

  console.log("Getting signaling channel endpoints...");
  const getSignalingChannelEndpointResponse: any =
    await kinesisVideoClient.send(getSignalingChannelEndpointResponseCommand);

  const endpointsByProtocol =
    getSignalingChannelEndpointResponse.ResourceEndpointList.reduce(
      (endpoints: any, endpoint: any) => {
        endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
        return endpoints;
      },
      {}
    );
  console.log("[VIEWER] Endpoints: ", endpointsByProtocol);

  // Create Signaling Client
  console.log(`Creating signaling client...`);
  state.signalingClient = new SignalingClient({
    channelARN,
    channelEndpoint: endpointsByProtocol.WSS,
    role: state.role, //roleOption.MASTER
    region: state.region,
    systemClockOffset: kinesisVideoClient.config.systemClockOffset,
    clientId: state.clientId,
    credentials: {
      accessKeyId: state.accessKey,
      secretAccessKey: state.secretAccessKey,
      sessionToken: state.sessionToken || null,
    },
  });

  const kinesisVideoSignalingChannelsClient = new KinesisVideoSignalingClient({
    region: state.region,
    endpoint: endpointsByProtocol.HTTPS,
    credentials: {
      accessKeyId: state.accessKey,
      secretAccessKey: state.secretAccessKey,
    },
  });

  const getIceServerConfigResponseCommand = new GetIceServerConfigCommand({
    ChannelARN: channelARN,
  });

  console.log("Getting ICE server config response...");

  const getIceServerConfigResponse: any =
    await kinesisVideoSignalingChannelsClient.send(
      getIceServerConfigResponseCommand
    );

  const iceServers = [];
  if (state.natTraversal === OPTIONS.TRAVERSAL.STUN_TURN) {
    console.log("Getting STUN servers...");
    iceServers.push({
      urls: `stun:stun.kinesisvideo.${state.region}.amazonaws.com:443`,
    });
  }

  if (state.natTraversal !== OPTIONS.TRAVERSAL.DISABLED) {
    console.log("Getting TURN servers...");
    getIceServerConfigResponse.IceServerList.forEach((iceServer: any) =>
      iceServers.push({
        urls: iceServer.Uris,
        username: iceServer.Username,
        credential: iceServer.Password,
      })
    );
  }

  const configuration: any = {
    iceServers,
    iceTransportPolicy:
      state.natTraversal === OPTIONS.TRAVERSAL.TURN_ONLY ? "relay" : "all",
  };

  state.peerConnection = new RTCPeerConnection(configuration);

  // Poll for connection stats
  state.peerConnectionStatsInterval = setInterval(() => {
    state.peerConnection.getStats().then(onStatsReport);
  }, 1000);

  /// REVIEW BELOW HERE

  state.signalingClient.on("open", async () => {
    console.log("[VIEWER] Connected to signaling service");

    state.peerConnection?.addTransceiver("video");
    // state.peerConnection?.addTransceiver("audio");
    state.peerConnection
      ?.getTransceivers()
      .forEach((t: any) => (t.direction = "recvonly"));

    // Create an SDP offer to send to the master
    console.log("[VIEWER] Creating SDP offer");
    await state.peerConnection.setLocalDescription(
      await state.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
    );

    // When trickle ICE is enabled, send the offer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
    if (state.useTrickleICE) {
      console.log("[VIEWER] Sending SDP offer");
      state.signalingClient.sendSdpOffer(state.peerConnection.localDescription);
    }
    console.log("[VIEWER] Generating ICE candidates");
  });

  state.signalingClient.on("sdpAnswer", async (answer: any) => {
    // Add the SDP answer to the peer connection
    console.log("[VIEWER] Received SDP answer");
    await state.peerConnection.setRemoteDescription(answer);
  });

  state.signalingClient.on("iceCandidate", (candidate: any) => {
    // Add the ICE candidate received from the MASTER to the peer connection
    console.log("[VIEWER] Received ICE candidate");
    setStatus("connected");
    state.peerConnection.addIceCandidate(candidate);
  });

  state.signalingClient.on("close", () => {
    console.log("[VIEWER] Disconnected from signaling channel");
    setStatus("disconnected");
  });

  state.signalingClient.on("error", (error: any) => {
    console.error("[VIEWER] Signaling client error: ", error);
    setStatus("error");
  });

  // Send any ICE candidates to the other peer
  state.peerConnection.addEventListener(
    "icecandidate",
    ({ candidate }: any) => {
      if (candidate) {
        // When trickle ICE is enabled, send the ICE candidates as they are generated.
        if (state.useTrickleICE) {
          state.signalingClient.sendIceCandidate(candidate);
        }
      } else {
        console.log("[VIEWER] All ICE candidates have been generated");
        setStatus("waitingForHost");
        // When trickle ICE is disabled, send the offer now that all the ICE candidates have ben generated.
        if (!state.useTrickleICE) {
          console.log("[VIEWER] Sending SDP offer");
          state.signalingClient.sendSdpOffer(
            state.peerConnection.localDescription
          );
        }
      }
    }
  );

  // As remote tracks are received, add them to the remote view
  state.peerConnection.addEventListener("track", (event: any) => {
    console.log("[VIEWER] Received remote track");
    if (state.remoteView.current.srcObject) {
      return;
    }
    state.remoteStream = event.streams[0];
    state.remoteView.current.srcObject = state.remoteStream;
  });

  console.log("[VIEWER] Starting viewer connection");
  state.signalingClient.open();
}

//------------------------------------------------------------------------------
function onStatsReport(report: any) {
  // TODO: Publish stats
}
//------------------------------------------------------------------------------
function getRandomClientId() {
  return Math.random().toString(36).substring(2).toUpperCase();
}

//------------------------------------------------------------------------------

export default KinesisWebRTC;
