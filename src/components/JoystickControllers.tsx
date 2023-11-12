import { Joystick } from "react-joystick-component";
import { IonButton } from "@ionic/react";
import { IonCol, IonGrid, IonRow, IonIcon } from "@ionic/react";
import "./JoystickController.css";
import {
  mqttMotorTopic,
  mqttSensorTopic,
  mqttConfig,
} from "../providers/constants";

import { swapHorizontalOutline } from "ionicons/icons";

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
  const [isJoystick, setIsJoystick] = useState<boolean>(
    process.env.APP_TYPE === "mobile" ? true : false
  );

  const allowedKeys = ["w", "a", "s", "d"];

  let currentKeyPadValueY = 0;
  let currentKeyPadValueX = 0;

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

      if (process.env.APP_TYPE === "web") {
        document.addEventListener("keydown", keypadUpdateValues);
        document.addEventListener("keyup", keypadStop);
      }

      return () => {
        client.end();
        document.removeEventListener("keydown", keypadUpdateValues);
      };
    }
  }, [client]);

  const keypadUpdateValues = (e: any) => {
    if (allowedKeys.includes(e.key)) {
      if (e.key === "w" && currentKeyPadValueY < 0.95)
        currentKeyPadValueY = currentKeyPadValueY + 0.05;
      else if (e.key === "s" && currentKeyPadValueY > -0.95)
        currentKeyPadValueY = currentKeyPadValueY - 0.05;
      else if (e.key === "a" && currentKeyPadValueX > -0.95)
        currentKeyPadValueX = currentKeyPadValueX - 0.05;
      else if (e.key === "d" && currentKeyPadValueX < 0.95)
        currentKeyPadValueX = currentKeyPadValueX + 0.05;

      console.log("publish", `${currentKeyPadValueX},${currentKeyPadValueY}`);

      client.publish(
        mqttMotorTopic,
        `${currentKeyPadValueX},${currentKeyPadValueY}`
      );
    }
  };

  const keypadStop = (e: any) => {
    if (allowedKeys.includes(e.key)) {
      if (e.key === "w" || e.key === "s") currentKeyPadValueY = 0;
      else if (e.key === "a" || e.key === "d") currentKeyPadValueX = 0;

      client.publish(
        mqttMotorTopic,
        `${currentKeyPadValueX},${currentKeyPadValueY}`
      );
    }
  };

  const steerControl = (data: any) => {
    client.publish(mqttMotorTopic, `${data.x},${data.y}`);
  };

  const steerStop = (data: any) => {
    client.publish(mqttMotorTopic, `0,0`);
  };

  const switchJoystick = () => {
    setIsJoystick(!isJoystick);
  };

  return (
    <>
      <IonGrid class="joystick-container-bottom">
        <IonRow class="joystick-container-padding">
          <IonCol>
            {isJoystick ? (
              <Joystick
                baseColor="gray"
                stickColor="lightgray"
                size={125}
                move={steerControl}
                stop={steerStop}
                throttle={100}
              ></Joystick>
            ) : (
              <div className="keypad-container">
                <div className="keypad-upper">
                  <IonButton size="large" disabled={true} color="medium">
                    W
                  </IonButton>
                </div>
                <div>
                  <IonButton
                    className="keypad-lower"
                    size="large"
                    color="medium"
                    disabled={true}
                  >
                    A
                  </IonButton>
                  <IonButton
                    className="keypad-lower"
                    size="large"
                    color="medium"
                    disabled={true}
                  >
                    S
                  </IonButton>
                  <IonButton disabled={true} size="large" color="medium">
                    D
                  </IonButton>
                </div>
              </div>
            )}

            <div className="key-switch tooltip">
              <div className="tooltiptext">
                Switch to {isJoystick ? "keyboard" : "joystick"}
              </div>
              <IonButton
                className=""
                onClick={switchJoystick}
                size="small"
                color="light"
              >
                <IonIcon icon={swapHorizontalOutline}></IonIcon>
              </IonButton>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default JoystickControllers;
