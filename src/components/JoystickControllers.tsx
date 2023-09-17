import { Joystick } from "react-joystick-component";
import { IonCol, IonGrid, IonRow } from "@ionic/react";
import "./JoystickController.css";
import * as mqtt from "mqtt";

const mqttTopic = "rovy/motor/c7de5c35-3882-48bc-bac6-f67fcf50da0f";

interface ContainerProps {}

const JoystickControllers: React.FC<ContainerProps> = () => {
  const clientId = "mqttjs_" + Math.random().toString(16).substr(2, 8);

  const host = "ws://54.169.163.170:8083/mqtt";

  const options: any = {
    keepalive: 60,
    clientId: clientId,
    protocolId: "MQTT",
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    will: {
      topic: "WillMsg",
      payload: "Connection Closed abnormally..!",
      qos: 0,
      retain: false,
    },
  };

  const client = mqtt.connect(host, options);

  client.on("connect", () => {
    console.log("connected");
  });

  client.on("message", (topic, message) => {
    // message is Buffer
    console.log(message.toString());
  });

  const steerControl = (data: any) => {
    client.publish(mqttTopic, `${data.x},${data.y}`);

    console.log(data);
  };

  const steerStop = (data: any) => {
    console.log(data);
    client.publish(mqttTopic, `0,0`);
  };

  return (
    <>
      <IonGrid class="joystick-container-bottom">
        <IonRow class="joystick-container-padding">
          <IonCol>
            <Joystick
              baseColor="gray"
              stickColor="lightgray"
              size={125}
              move={steerControl}
              stop={steerStop}
              throttle={100}
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

export default JoystickControllers;
