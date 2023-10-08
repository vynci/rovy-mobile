import { IonCol, IonGrid, IonRow } from "@ionic/react";
import "./StatusMonitor.css";

interface ContainerProps {
  mqttStatus: string;
}

const status: any = {
  pending: { color: "orange", message: "Connecting..." },
  reconnect: { color: "yellow", message: "Reconnecting..." },
  connected: { color: "greenyellow", message: "Connected" },
  disconnected: { color: "orangered", message: "Disconnected" },
  error: { color: "orangered", message: "Error" },
};

const StatusMonitor: React.FC<ContainerProps> = ({ mqttStatus }) => {
  return (
    <>
      <IonGrid class="status-container-top">
        <IonRow>
          <IonCol>
            <span>MQTT: </span>{" "}
            <span
              style={{ color: status[mqttStatus].color }}
            >{`${status[mqttStatus].message}`}</span>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default StatusMonitor;
