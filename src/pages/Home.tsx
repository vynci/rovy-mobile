import { IonContent, IonPage } from "@ionic/react";
import KinesisWebRTC from "../components/KinesisWebRTC";
import JoystickControllers from "../components/JoystickControllers";
import StatusMonitor from "../components/StatusMonitor";
import GaugeControllers from "../components/Gauge";
import ProximityWarning from "../components/ProximityWarning";

import { sensorDefaultValue } from "../providers/default";

import MapSection from "../components/Map";

import "./Home.css";

import { useState } from "react";

const Home: React.FC = () => {
  const [mqttStatus, setMqttStatus] = useState<string>("pending");
  const [sensorData, setSensorData] = useState<any>(sensorDefaultValue);
  const [kvsStatus, setKvsStatus] = useState<string>("pending");

  return (
    <IonPage>
      <IonContent class="main-content" fullscreen>
        <JoystickControllers
          setMqttStatus={setMqttStatus}
          setSensorData={setSensorData}
        />
        <StatusMonitor
          mqttStatus={mqttStatus}
          kvsStatus={kvsStatus}
          sensorData={sensorData}
        />
        <KinesisWebRTC setKvsStatus={setKvsStatus}></KinesisWebRTC>
        <GaugeControllers sensorData={sensorData}></GaugeControllers>
        <ProximityWarning sensorData={sensorData}></ProximityWarning>
        <MapSection sensorData={sensorData}></MapSection>
      </IonContent>
    </IonPage>
  );
};

export default Home;
