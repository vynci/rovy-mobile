import { IonCol, IonGrid, IonRow } from "@ionic/react";
import "./StatusMonitor.css";

interface ContainerProps {
  mqttStatus: string;
  kvsStatus: string;
}

const status: any = {
  pending: { color: "orange", message: "Connecting" },
  reconnect: { color: "yellow", message: "Reconnecting" },
  waitingForHost: { color: "yellow", message: "Waiting for host" },
  connected: { color: "greenyellow", message: "Connected" },
  disconnected: { color: "orangered", message: "Disconnected" },
  error: { color: "orangered", message: "Error" },
};

const StatusMonitor: React.FC<ContainerProps> = ({ mqttStatus, kvsStatus }) => {
  return (
    <>
      <IonGrid class="status-container-top">
        <IonRow>
          <IonCol size="2">
            <span>MQTT: </span>{" "}
            <span
              style={{ color: status[mqttStatus].color }}
            >{`${status[mqttStatus].message}`}</span>
          </IonCol>
          <IonCol size="3">
            <span>Video: </span>{" "}
            <span
              style={{ color: status[kvsStatus].color }}
            >{`${status[kvsStatus].message}`}</span>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default StatusMonitor;
