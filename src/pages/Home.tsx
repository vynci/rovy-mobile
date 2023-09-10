import { IonContent, IonPage } from "@ionic/react";
import JoystickControllers from "../components/JoystickControllers";
import KinesisWebRTC from "../components/videoStream";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        <JoystickControllers></JoystickControllers>
        <KinesisWebRTC></KinesisWebRTC>
      </IonContent>
    </IonPage>
  );
};

export default Home;
