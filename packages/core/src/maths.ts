import { tuple } from "./utils.ts";

export const calculateAngle = (x: number, y: number): number => {
  if (x === 0 && y === 0) return 0;
  else if (y === 0) return x > 0 ? 0 : Math.PI;
  else if (x === 0) return y > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
  else if (x > 0 && y > 0) return Math.PI / 2 - Math.atan(x / y);
  else if (x > 0) return (Math.PI * 3) / 2 + Math.atan(x / -y);
  else if (y > 0) return Math.PI - Math.atan(y / -x);
  else return (Math.PI * 3) / 2 - Math.atan(x / y);
};

export const cartesianToPolar = (x: number, y: number) =>
  tuple(Math.hypot(x, y), calculateAngle(x, y));

export const polarToCartesian = (magnitude: number, angle: number) =>
  tuple(magnitude * Math.cos(angle), magnitude * Math.sin(angle));

export const positiveMod = (a: number, b: number) => ((a % b) + b) % b;
