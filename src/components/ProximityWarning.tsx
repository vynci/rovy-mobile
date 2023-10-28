import { IonCol, IonGrid, IonRow, IonIcon } from "@ionic/react";
import { handLeft } from "ionicons/icons";
import "./ProximityWarning.css";

interface ContainerProps {
  sensorData: any;
}

const ProximityWarning: React.FC<ContainerProps> = ({ sensorData }) => {
  return (
    <>
      <IonGrid class="proximity-warning-container-bottom">
        <IonRow>
          <IonCol>
            {sensorData.range.ir.value > 1.5 ? (
              <div style={{ fontSize: "6em", fontWeight: "bold" }}>
                <IonIcon icon={handLeft}></IonIcon>{" "}
              </div>
            ) : (
              ""
            )}
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default ProximityWarning;
