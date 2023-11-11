import { useEffect, useRef, useState } from "react";
import { Marker, Map } from "mapbox-gl";

export const useMap = (
  container: React.RefObject<HTMLDivElement>,
  sensorData: any
) => {
  const [marker, setMarker] = useState<any>();
  const mapInitRef = useRef<Map | null>(null);

  useEffect(() => {
    if (container.current) {
      mapInitRef.current = initMap(
        container.current,
        [-79.51939702033998, 43.66322274012296]
      );
    }
  }, []);

  useEffect(() => {
    if (
      mapInitRef.current &&
      sensorData.gps.lon.value &&
      sensorData.gps.lat.value
    ) {
      mapInitRef.current?.setCenter([
        sensorData.gps.lon.value,
        sensorData.gps.lat.value,
      ]);

      if (marker)
        marker.setLngLat([sensorData.gps.lon.value, sensorData.gps.lat.value]);
      else
        setMarker(
          generateNewMarker({
            map: mapInitRef.current!,
            lat: sensorData.gps.lat.value,
            lng: sensorData.gps.lon.value,
          })
        );
    }
  }, [sensorData]);
};

const initMap = (container: HTMLDivElement, coords: [number, number]) => {
  return new Map({
    container,
    style: "mapbox://styles/mapbox/dark-v10",
    pitchWithRotate: false,
    center: coords,
    zoom: 17,
    accessToken: process.env.MAPBOX_TOKEN,
    doubleClickZoom: false,
  });
};

const generateNewMarker = ({
  lat,
  lng,
  map,
}: {
  lng: number;
  lat: number;
  map: Map;
}) =>
  new Marker({ color: "greenyellow", scale: 0.75 })
    .setLngLat([lng, lat])
    .addTo(map);
