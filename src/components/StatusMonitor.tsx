import { IonCol, IonGrid, IonRow, IonIcon } from "@ionic/react";
import {
  videocam,
  gameController,
  radioButtonOn,
  cellular,
  location,
  thermometer,
  water,
  flash,
  caretUpCircle,
} from "ionicons/icons";

import "./StatusMonitor.css";

interface ContainerProps {
  mqttStatus: string;
  kvsStatus: string;
  sensorData: any;
}

const status: any = {
  pending: { color: "orange", message: "Connecting" },
  reconnect: { color: "yellow", message: "Reconnecting" },
  waitingForHost: { color: "yellow", message: "Waiting for host" },
  connected: { color: "greenyellow", message: "Connected" },
  disconnected: { color: "orangered", message: "Disconnected" },
  error: { color: "orangered", message: "Error" },
};

const StatusMonitor: React.FC<ContainerProps> = ({
  mqttStatus,
  kvsStatus,
  sensorData,
}) => {
  return (
    <>
      <IonGrid class="status-container-top">
        <IonRow>
          <IonCol size="1">
            <span>
              <IonIcon icon={flash}></IonIcon>{" "}
            </span>{" "}
            <span style={{ color: status.connected.color, fontSize: "small" }}>
              {sensorData.battery.voltage.value || 0}
              {sensorData.battery.voltage.unit}
            </span>
          </IonCol>

          <IonCol size="1">
            <span>
              <IonIcon icon={thermometer}></IonIcon>{" "}
            </span>{" "}
            <span style={{ color: status.connected.color, fontSize: "small" }}>
              {sensorData.bme280.temperature.value || 0}
              {sensorData.bme280.temperature.unit}
            </span>
          </IonCol>

          <IonCol size="1">
            <span>
              <IonIcon icon={water}></IonIcon>{" "}
            </span>{" "}
            <span style={{ color: status.connected.color, fontSize: "small" }}>
              {sensorData.bme280.humidity.value || 0}
              {sensorData.bme280.humidity.unit}
            </span>
          </IonCol>

          <IonCol size="1">
            <span>
              <IonIcon icon={caretUpCircle}></IonIcon>{" "}
            </span>{" "}
            <span style={{ color: status.connected.color, fontSize: "small" }}>
              {sensorData.gps.alt.value || 0}
              {sensorData.gps.alt.unit}
            </span>
          </IonCol>

          <IonCol size="5">
            <span>
              <IonIcon icon={location}></IonIcon>{" "}
            </span>{" "}
            <span style={{ color: status.connected.color, fontSize: "small" }}>
              {sensorData.gps.lat.value || 0}, {sensorData.gps.lon.value || 0}
            </span>
          </IonCol>

          <IonCol size="1">
            <span>
              <IonIcon icon={gameController}></IonIcon>{" "}
            </span>
            <span style={{ color: status[mqttStatus].color }}>
              <IonIcon icon={radioButtonOn}></IonIcon>{" "}
            </span>
          </IonCol>

          <IonCol size="1">
            <span>
              <IonIcon icon={videocam}></IonIcon>{" "}
            </span>{" "}
            <span style={{ color: status[kvsStatus].color }}>
              <IonIcon icon={radioButtonOn}></IonIcon>{" "}
            </span>
          </IonCol>

          <IonCol size="1">
            <span>
              <IonIcon icon={cellular}></IonIcon>{" "}
            </span>{" "}
            <span style={{ color: status.connected.color }}>
              <IonIcon icon={radioButtonOn}></IonIcon>{" "}
            </span>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default StatusMonitor;
