import { IonContent, IonPage } from "@ionic/react";
import JoystickControllers from "../components/JoystickControllers";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        <JoystickControllers></JoystickControllers>
      </IonContent>
    </IonPage>
  );
};

export default Home;
