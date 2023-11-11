import { IonGrid } from "@ionic/react";
import { useRef, useEffect } from "react";
import { useMap } from "../hooks/useMap";

import "./Map.css";

interface ContainerProps {
  sensorData: any;
}

const MapSection: React.FC<ContainerProps> = ({ sensorData }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useMap(mapRef, sensorData);

  return (
    <>
      <IonGrid class="map-container-top">
        <div ref={mapRef} className="map" />
      </IonGrid>
    </>
  );
};

export default MapSection;
