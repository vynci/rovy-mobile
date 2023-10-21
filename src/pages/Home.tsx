import { IonContent, IonPage } from "@ionic/react";
import KinesisWebRTC from "../components/KinesisWebRTC";
import JoystickControllers from "../components/JoystickControllers";
import StatusMonitor from "../components/StatusMonitor";
import "./Home.css";
import { useState } from "react";

const Home: React.FC = () => {
  const [mqttStatus, setMqttStatus] = useState<string>("pending");
  const [kvsStatus, setKvsStatus] = useState<string>("pending");

  return (
    <IonPage>
      <IonContent class="main-content" fullscreen>
        <JoystickControllers setMqttStatus={setMqttStatus} />
        <StatusMonitor mqttStatus={mqttStatus} kvsStatus={kvsStatus} />
        <KinesisWebRTC setKvsStatus={setKvsStatus}></KinesisWebRTC>
      </IonContent>
    </IonPage>
  );
};

export default Home;
