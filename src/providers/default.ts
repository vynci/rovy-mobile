export const sensorDefaultValue = {
  battery: {
    voltage: {
      value: 0,
      unit: "V",
    },
    percent: {
      value: 0,
      unit: "%",
    },
  },
  bme280: {
    temperature: {
      value: 0,
      unit: "°C",
    },
    humidity: {
      value: 0,
      unit: "%",
    },
  },
  gps: {
    lat: {
      value: "43.66322274012296",
    },
    lon: {
      value: "-79.51939702033998",
    },
    speed: {
      value: 0,
    },
    track: {
      value: 0,
      unit: "°",
    },
    alt: {
      value: 0,
      unit: "m",
    },
  },
  lte: {
    signal: { value: "22,99" },
  },
  range: {
    ir: { value: 50, unit: "cm" },
  },
};
