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

// Used to determine / validate options in form components:
const OPTIONS = {
  TRAVERSAL: {
    STUN_TURN: "stunTurn",
    TURN_ONLY: "turnOnly",
    DISABLED: "disabled",
    WIDESCREEN: "widescreen",
  },
  ROLE: {
    MASTER: "MASTER",
    VIEWER: "VIEWER",
  },
  RESOLUTION: {
    WIDESCREEN: "widescreen",
    FULLSCREEN: "fullscreen",
  },
};

// Stores state across components (react-easy-state is super easy to use!)
const state: any = store({
  // These are config params set by the user:
  accessKey: process.env.KVS_KEY,
  secretAccessKey: process.env.KVS_SECRET,
  sessionToken: "",
  region: "us-east-1",
  role: OPTIONS.ROLE.VIEWER,
  channelName: "test-stream",
  clientId: getRandomClientId(),
  endpoint: null,
  sendVideo: false,
  sendAudio: false,
  openDataChannel: false,
  resolution: OPTIONS.RESOLUTION.WIDESCREEN,
  natTraversal: OPTIONS.TRAVERSAL.STUN_TURN,
  useTrickleICE: true,
  messageToSend: "",
  playerIsStarted: false,

  // These are set when user starts video; a few of them are only used when you start the stream as MASTER:
  signalingClient: null,
  localStream: null,
  localView: null,
  remoteView: null,
  dataChannel: null,
  peerConnectionStatsInterval: null,
  peerConnectionByClientId: {},
  dataChannelByClientId: [],
  receivedMessages: "",
  statusMessages: {
    controls: "Connected",
    telemetry: "Connected",
    videoStream: "Connecting...",
  },
});

const KinesisWebRTC = view(() => {
  state.localView = useRef(null);
  state.remoteView = useRef(null);

  // When widget first loads, get saved state values from localStorage:
  useEffect(() => {
    startPlayer();
  }, []);

  return <>{state.playerIsStarted ? <VideoPlayers /> : null}</>;
});

//------------------------------------------------------------------------------
const VideoPlayers = view(() => {
  console.log("state.localView", state.localView);

  return (
    <>
      <div id="video-players">
        <div>
          <div>
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
        </div>
      </div>
      <div
        style={{
          padding: 15,
          width: 230,
          color: "white",
          position: "absolute",
          opacity: 0.6,
          background: "dimgrey",
        }}
      >
        <div>
          Controls:{" "}
          <span
            style={{
              color: `${
                state.statusMessages.controls === "Connected"
                  ? "palegreen"
                  : "orange"
              }`,
            }}
          >
            {state.statusMessages.controls}
          </span>
        </div>
        <div>
          Telemetry:{" "}
          <span
            style={{
              color: `${
                state.statusMessages.telemetry === "Connected"
                  ? "palegreen"
                  : "orange"
              }`,
            }}
          >
            {state.statusMessages.telemetry}
          </span>
        </div>
        <div>
          Video:{" "}
          <span
            style={{
              color: `${
                state.statusMessages.videoStream === "Connected"
                  ? "palegreen"
                  : "orange"
              }`,
            }}
          >
            {state.statusMessages.videoStream}
          </span>
        </div>
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
  // Create KVS client
  console.log("Created KVS client...");
  const kinesisVideoClient = new KinesisVideoClient({
    region: state.region,
    endpoint: state.endpoint || null,
    credentials: {
      accessKeyId: "AKIAZKXGLX3DHTX3LKU7",
      secretAccessKey: "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",
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
      accessKeyId: "AKIAZKXGLX3DHTX3LKU7",
      secretAccessKey: "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",
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

  const resolution =
    state.resolution === OPTIONS.TRAVERSAL.WIDESCREEN
      ? { width: { ideal: 1280 }, height: { ideal: 720 } }
      : { width: { ideal: 640 }, height: { ideal: 480 } };

  const constraints = {
    video: state.sendVideo ? resolution : false,
    audio: state.sendAudio,
  };

  state.peerConnection = new RTCPeerConnection(configuration);

  // Poll for connection stats
  state.peerConnectionStatsInterval = setInterval(() => {
    state.peerConnection.getStats().then(onStatsReport);
  }, 1000);

  /// REVIEW BELOW HERE

  state.signalingClient.on("open", async () => {
    console.log("[VIEWER] Connected to signaling service");

    // Get a stream from the webcam, add it to the peer connection, and display it in the local view.
    // If no video/audio needed, no need to request for the sources.
    // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
    if (state.sendVideo || state.sendAudio) {
      try {
        state.localStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        state.localStream
          .getTracks()
          .forEach((track: any) =>
            state.peerConnection.addTrack(track, state.localStream)
          );
        // state.localView.current.srcObject = state.localStream;
      } catch (e) {
        console.log("err", e);
        console.error("[VIEWER] Could not find webcam");
        return;
      }
    } else {
      state.peerConnection?.addTransceiver("video");
      state.peerConnection
        ?.getTransceivers()
        .forEach((t: any) => (t.direction = "recvonly"));
    }

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
    state.statusMessages.videoStream = "Connected";
    state.peerConnection.addIceCandidate(candidate);
  });

  state.signalingClient.on("close", () => {
    console.log("[VIEWER] Disconnected from signaling channel");
    state.statusMessages.video = "Disconnected";
  });

  state.signalingClient.on("error", (error: any) => {
    console.error("[VIEWER] Signaling client error: ", error);
    state.statusMessages.video = "Unknown Error";
  });

  // Send any ICE candidates to the other peer
  state.peerConnection.addEventListener(
    "icecandidate",
    ({ candidate }: any) => {
      if (candidate) {
        console.log("[VIEWER] Generated ICE candidate");

        // When trickle ICE is enabled, send the ICE candidates as they are generated.
        if (state.useTrickleICE) {
          console.log("[VIEWER] Sending ICE candidate");
          state.signalingClient.sendIceCandidate(candidate);
        }
      } else {
        console.log("[VIEWER] All ICE candidates have been generated");
        state.statusMessages.videoStream = "Waiting for host...";
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
