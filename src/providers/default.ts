export const sensorDefaultValue = {
  battery: {
    voltage: {
      value: 11.47,
      unit: "V",
    },
    percent: {
      value: 80,
      unit: "%",
    },
  },
  bme280: {
    temperature: {
      value: 12,
      unit: "°C",
    },
    humidity: {
      value: 37,
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
      value: 27,
      unit: "°",
    },
    alt: {
      value: 128,
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
