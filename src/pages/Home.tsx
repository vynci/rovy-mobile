import { IonContent, IonPage } from "@ionic/react";
import JoystickControllers from "../components/JoystickControllers";
import KinesisWebRTC from "../components/VideoStream";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        <KinesisWebRTC></KinesisWebRTC>
        <JoystickControllers></JoystickControllers>
      </IonContent>
    </IonPage>
  );
};

export default Home;
