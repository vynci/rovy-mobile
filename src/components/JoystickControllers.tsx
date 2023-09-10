import { Joystick } from "react-joystick-component";
import { IonCol, IonGrid, IonRow } from "@ionic/react";
import "./JoystickController.css";

interface ContainerProps {}

const ExploreContainer: React.FC<ContainerProps> = () => {
  return (
    <>
      <IonGrid class="joystick-container-bottom">
        <IonRow class="joystick-container-padding">
          <IonCol>
            <Joystick size={150} move={() => {}} stop={() => {}}></Joystick>
          </IonCol>
          <IonCol class="joystick-align-right">
            <Joystick size={150} move={() => {}} stop={() => {}}></Joystick>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default ExploreContainer;
