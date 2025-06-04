import { tuple } from "./tuple.ts";

export const cartesianToPolar = (x: number, y: number) =>
  tuple(Math.hypot(x, y), Math.atan2(y, x));

export const polarToCartesian = (magnitude: number, angle: number) =>
  tuple(magnitude * Math.cos(angle), magnitude * Math.sin(angle));

export const positiveMod = (a: number, b: number) => ((a % b) + b) % b;
