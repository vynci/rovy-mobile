import { useEffect, useRef } from "react";
import { store, view } from "@risingstack/react-easy-state";
import KinesisVideo from "aws-sdk/clients/kinesisvideo";
import KinesisVideoSignalingChannels from "aws-sdk/clients/kinesisvideosignalingchannels";
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
  accessKey: "AKIAZKXGLX3DHTX3LKU7",
  secretAccessKey: "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",
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
});

const KinesisWebRTC = view(() => {
  // In order to modify properties of our <video> components, we need a reference
  // to them in the DOM; first, we declare set them up with the useRef hook.
  // Later, when we render the <VideoPlayers/> component, we include this reference
  // in the component definition. Finally, we can reference the object properties
  // by state.localView.current.<PROPERTY>:
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
  console.log("state.localView", state.remoteView);

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
              controls
              autoPlay
              playsInline
              muted
            />
          </div>
        </div>
      </div>
    </>
  );
});

//------------------------------------------------------------------------------
function startPlayer() {
  state.playerIsStarted = true;
  console.log(`role is '${state.role}'`);
  if (state.role === OPTIONS.ROLE.MASTER) {
    startPlayerForMaster();
  } else {
    startPlayerForViewer();
  }
}

//------------------------------------------------------------------------------
async function startPlayerForMaster() {
  // Create KVS client
  console.log("Creating KVS client...");
  const kinesisVideoClient = new KinesisVideo({
    region: state.region,
    endpoint: state.endpoint || null,
    correctClockSkew: true,
    accessKeyId: state.accessKey,
    secretAccessKey: state.secretAccessKey,
    sessionToken: state.sessionToken || null,
  });

  // Get signaling channel ARN
  console.log("Getting signaling channel ARN...");
  const describeSignalingChannelResponse: any = await kinesisVideoClient
    .describeSignalingChannel({
      ChannelName: state.channelName,
    })
    .promise();

  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
  console.log("[MASTER] Channel ARN: ", channelARN);

  // Get signaling channel endpoints:
  console.log("Getting signaling channel endpoints...");
  const getSignalingChannelEndpointResponse: any = await kinesisVideoClient
    .getSignalingChannelEndpoint({
      ChannelARN: channelARN,
      SingleMasterChannelEndpointConfiguration: {
        Protocols: ["WSS", "HTTPS"],
        Role: state.role, //roleOption.MASTER
      },
    })
    .promise();

  const endpointsByProtocol =
    getSignalingChannelEndpointResponse.ResourceEndpointList.reduce(
      (endpoints: any, endpoint: any) => {
        endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
        return endpoints;
      },
      {}
    );
  console.log("[MASTER] Endpoints: ", endpointsByProtocol);

  // Create Signaling Client
  console.log(`Creating signaling client...`);
  state.signalingClient = new SignalingClient({
    channelARN,
    channelEndpoint: endpointsByProtocol.WSS,
    role: state.role, //roleOption.MASTER
    region: state.region,
    systemClockOffset: kinesisVideoClient.config.systemClockOffset,
    credentials: {
      accessKeyId: state.accessKey,
      secretAccessKey: state.secretAccessKey,
      sessionToken: state.sessionToken || null,
    },
  });

  // Get ICE server configuration
  console.log("Creating ICE server configuration...");
  const kinesisVideoSignalingChannelsClient = new KinesisVideoSignalingChannels(
    {
      region: state.region,
      endpoint: endpointsByProtocol.HTTPS,
      correctClockSkew: true,
      accessKeyId: state.accessKey,
      secretAccessKey: state.secretAccessKey,
      sessionToken: state.sessionToken || null,
    }
  );

  console.log("Getting ICE server config...");
  const getIceServerConfigResponse: any =
    await kinesisVideoSignalingChannelsClient
      .getIceServerConfig({
        ChannelARN: channelARN,
      })
      .promise();

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

  // Get a stream from the webcam and display it in the local view.
  // If no video/audio needed, no need to request for the sources.
  // Otherwise, the browser will throw an error saying that either video or audio has to be enabled.
  if (state.sendVideo || state.sendAudio) {
    try {
      console.log("Getting user media stream...");
      state.localStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      console.log("state.localView.current", state.localView.current);

      state.localView.current.srcObject = state.localStream;

      console.log("state.localView", state.localView);

      //localView.current.srcObject = appStore.master.localStream;
    } catch (e) {
      console.log("Error: ", e);
      console.error("[MASTER] Could not find webcam");
    }
  }

  console.log("Adding signalingClient.on open handler...");
  state.signalingClient.on("open", async () => {
    console.log("[MASTER] Connected to signaling service");
  });

  console.log("Adding signalingClient.on sdpOffer handler...");

  state.signalingClient.on(
    "sdpOffer",
    async (offer: any, remoteClientId: any) => {
      console.log("[MASTER] Received SDP offer from client: " + remoteClientId);

      // Create a new peer connection using the offer from the given client
      const peerConnection = new RTCPeerConnection(configuration);

      state.peerConnectionByClientId[remoteClientId] = peerConnection;

      if (state.openDataChannel) {
        console.log(`Opened data channel with ${remoteClientId}`);
        state.dataChannelByClientId[remoteClientId] =
          peerConnection.createDataChannel("kvsDataChannel");
        peerConnection.ondatachannel = (event) => {
          event.channel.onmessage = (message) => {
            const timestamp = new Date().toISOString();
            const loggedMessage = `${timestamp} - from ${remoteClientId}: ${message.data}\n`;
            console.log(loggedMessage);
            state.receivedMessages += loggedMessage;
          };
        };
      }

      // Poll for connection stats
      if (!state.peerConnectionStatsInterval) {
        state.peerConnectionStatsInterval = setInterval(
          () => peerConnection.getStats().then(onStatsReport),
          1000
        );
      }

      // Send any ICE candidates to the other peer
      peerConnection.addEventListener("icecandidate", ({ candidate }) => {
        if (candidate) {
          console.log(
            "[MASTER] Generated ICE candidate for client: " + remoteClientId
          );

          // When trickle ICE is enabled, send the ICE candidates as they are generated.
          if (state.useTrickleICE) {
            console.log(
              "[MASTER] Sending ICE candidate to client: " + remoteClientId
            );
            state.signalingClient.sendIceCandidate(candidate, remoteClientId);
          }
        } else {
          console.log(
            "[MASTER] All ICE candidates have been generated for client: " +
              remoteClientId
          );

          // When trickle ICE is disabled, send the answer now that all the ICE candidates have ben generated.
          if (!state.useTrickleICE) {
            console.log(
              "[MASTER] Sending SDP answer to client: " + remoteClientId
            );
            state.signalingClient.sendSdpAnswer(
              peerConnection.localDescription,
              remoteClientId
            );
          }
        }
      });

      // As remote tracks are received, add them to the remote view
      console.log('Adding peerConnection listener for "track"...');

      peerConnection.addEventListener("track", (event) => {
        console.log(
          "[MASTER] Received remote track from client: " + remoteClientId
        );
        if (state.remoteView.current.srcObject) {
          return;
        }

        state.remoteView.current.srcObject = event.streams[0];
      });

      // If there's no video/audio, master.localStream will be null. So, we should skip adding the tracks from it.
      if (state.localStream) {
        console.log("There's no audio/video...");
        state.localStream
          .getTracks()
          .forEach((track: any) =>
            peerConnection.addTrack(track, state.localStream)
          );
      }
      await peerConnection.setRemoteDescription(offer);

      // Create an SDP answer to send back to the client
      console.log("[MASTER] Creating SDP answer for client: " + remoteClientId);
      await peerConnection.setLocalDescription(
        await peerConnection.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
      );

      // When trickle ICE is enabled, send the answer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
      if (state.useTrickleICE) {
        console.log("[MASTER] Sending SDP answer to client: " + remoteClientId);
        state.signalingClient.sendSdpAnswer(
          peerConnection.localDescription,
          remoteClientId
        );
      }
      console.log(
        "[MASTER] Generating ICE candidates for client: " + remoteClientId
      );
    }
  );

  state.signalingClient.on(
    "iceCandidate",
    async (candidate: any, remoteClientId: any) => {
      console.log(
        "[MASTER] Received ICE candidate from client: " + remoteClientId
      );

      // Add the ICE candidate received from the client to the peer connection
      const peerConnection = state.peerConnectionByClientId[remoteClientId];
      peerConnection.addIceCandidate(candidate);
    }
  );

  state.signalingClient.on("close", () => {
    console.log("[MASTER] Disconnected from signaling channel");
  });

  state.signalingClient.on("error", () => {
    console.error("[MASTER] Signaling client error");
  });

  console.log("[MASTER] Starting master connection");
  state.signalingClient.open();
}

//------------------------------------------------------------------------------
async function startPlayerForViewer() {
  // Create KVS client
  console.log("Created KVS client...");
  const kinesisVideoClient = new KinesisVideo({
    region: state.region,
    endpoint: state.endpoint || null,
    correctClockSkew: true,
    accessKeyId: state.accessKey,
    secretAccessKey: state.secretAccessKey,
    sessionToken: state.sessionToken || null,
  });

  // Get signaling channel ARN
  console.log("Getting signaling channel ARN...");
  const describeSignalingChannelResponse: any = await kinesisVideoClient
    .describeSignalingChannel({
      ChannelName: state.channelName,
    })
    .promise();

  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
  console.log("[VIEWER] Channel ARN: ", channelARN);

  // Get signaling channel endpoints:
  console.log("Getting signaling channel endpoints...");
  const getSignalingChannelEndpointResponse: any = await kinesisVideoClient
    .getSignalingChannelEndpoint({
      ChannelARN: channelARN,
      SingleMasterChannelEndpointConfiguration: {
        Protocols: ["WSS", "HTTPS"],
        Role: state.role, //roleOption.MASTER
      },
    })
    .promise();

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

  // Get ICE server configuration
  console.log("Creating ICE server configuration...");
  const kinesisVideoSignalingChannelsClient = new KinesisVideoSignalingChannels(
    {
      region: state.region,
      endpoint: endpointsByProtocol.HTTPS,
      correctClockSkew: true,
      accessKeyId: state.accessKey,
      secretAccessKey: state.secretAccessKey,
      sessionToken: state.sessionToken || null,
    }
  );

  console.log("Getting ICE server config response...");
  const getIceServerConfigResponse: any =
    await kinesisVideoSignalingChannelsClient
      .getIceServerConfig({
        ChannelARN: channelARN,
      })
      .promise();

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
  if (state.openDataChannel) {
    console.log(`Opened data channel with MASTER.`);
    state.dataChannel =
      state.peerConnection.createDataChannel("kvsDataChannel");
    state.peerConnection.ondatachannel = (event: any) => {
      event.channel.onmessage = (message: any) => {
        const timestamp = new Date().toISOString();
        const loggedMessage = `${timestamp} - from MASTER: ${message.data}\n`;
        console.log(loggedMessage);
        state.receivedMessages += loggedMessage;
      };
    };
  }

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
        state.localView.current.srcObject = state.localStream;
      } catch (e) {
        console.error("[VIEWER] Could not find webcam");
        return;
      }
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
    state.peerConnection.addIceCandidate(candidate);
  });

  state.signalingClient.on("close", () => {
    console.log("[VIEWER] Disconnected from signaling channel");
  });

  state.signalingClient.on("error", (error: any) => {
    console.error("[VIEWER] Signaling client error: ", error);
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
  console.log("report", report);
}
//------------------------------------------------------------------------------
function getRandomClientId() {
  return Math.random().toString(36).substring(2).toUpperCase();
}

//------------------------------------------------------------------------------

export default KinesisWebRTC;
