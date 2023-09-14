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
            <Joystick
              baseColor="gray"
              stickColor="lightgray"
              size={125}
              move={() => {}}
              stop={() => {}}
            ></Joystick>
          </IonCol>
          <IonCol class="joystick-align-right">
            <Joystick
              baseColor="gray"
              stickColor="lightgray"
              size={125}
              move={() => {}}
              stop={() => {}}
            ></Joystick>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default ExploreContainer;
