import { Joystick } from "react-joystick-component";
import { IonCol, IonGrid, IonRow } from "@ionic/react";
import "./JoystickController.css";
import {
  mqttMotorTopic,
  mqttSensorTopic,
  mqttConfig,
} from "../providers/constants";

import AWSIoT from "aws-iot-device-sdk";
import { useEffect, useState } from "react";

interface ContainerProps {
  setMqttStatus: any;
  setSensorData: any;
}

const JoystickControllers: React.FC<ContainerProps> = ({
  setMqttStatus,
  setSensorData,
}) => {
  const [client, setClient] = useState<any>();

  useEffect(() => {
    setClient(new AWSIoT.device(mqttConfig));
  }, []);

  useEffect(() => {
    if (client) {
      client.on("connect", () => {
        client.subscribe(mqttSensorTopic, () => {
          console.log("subscribed to ", mqttSensorTopic);
        });
        setMqttStatus("connected");
      });

      client.on("error", (e: any) => {
        setMqttStatus("error");
      });

      client.on("disconnect", (e: any) => {
        setMqttStatus("disconnected");
      });

      client.on("reconnect", (e: any) => {
        setMqttStatus("reconnect");
      });

      client.on("message", (topic: any, message: any) => {
        setSensorData(JSON.parse(message.toString()));
      });

      return () => {
        client.end();
      };
    }
  }, [client]);

  const steerControl = (data: any) => {
    client.publish(mqttMotorTopic, `${data.x},${data.y}`);
  };

  const steerStop = (data: any) => {
    client.publish(mqttMotorTopic, `0,0`);
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
        </IonRow>
      </IonGrid>
    </>
  );
};

export default JoystickControllers;
