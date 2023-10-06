import { IonContent, IonPage } from "@ionic/react";
import JoystickControllers from "../components/JoystickControllers";
import StatusMonitor from "../components/StatusMonitor";
import "./Home.css";
import { useState } from "react";

const Home: React.FC = () => {
  const [mqttStatus, setMqttStatus] = useState<string>("pending");

  return (
    <IonPage>
      <IonContent class="main-content" fullscreen>
        <JoystickControllers setMqttStatus={setMqttStatus} />
        <StatusMonitor mqttStatus={mqttStatus} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
