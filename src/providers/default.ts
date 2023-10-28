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
      value: "43.662943",
    },
    lon: {
      value: "-79.5199132",
    },
    speed: {
      value: 4,
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
