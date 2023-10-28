import { IonCol, IonGrid, IonRow } from "@ionic/react";
import "./Gauge.css";

interface ContainerProps {
  sensorData: any;
}

const GaugeControllers: React.FC<ContainerProps> = ({ sensorData }) => {
  return (
    <>
      <IonGrid class="gauge-container-bottom">
        <IonRow>
          <IonCol>
            <div style={{ fontSize: "4em", fontWeight: "bold" }}>
              {sensorData.gps.speed.value || 0}
            </div>
            <div style={{ fontSize: "1.5em", fontWeight: 300 }}>km/h</div>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default GaugeControllers;
