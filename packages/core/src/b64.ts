import { positiveMod } from "./utils.js";

const BASE_64_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
export const intToB64 = (n: number, length?: number): string => {
  let base64Str = "";
  while (n) {
    base64Str = BASE_64_CHARS[positiveMod(n, 64)] ?? "" + base64Str;
    n = n > 0 ? Math.floor(n / 64) : Math.ceil(n / 64);
  }
  return length != null
    ? base64Str
        .padStart(length, "0")
        .slice(Math.max(base64Str.length - length, 0))
    : base64Str;
};

export const b64ToInt = (str: string): number => {
  let n = 0;
  for (const char of str) {
    n = n * 64 + BASE_64_CHARS.indexOf(char);
  }
  return n;
};
