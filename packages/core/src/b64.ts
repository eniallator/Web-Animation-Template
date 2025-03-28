const BASE_64_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";

export const intToB64 = (n: number, length?: number): string => {
  let base64 = "";
  n = Math.abs(n);
  while (n) {
    base64 = (BASE_64_CHARS[n % 64] ?? "") + base64;
    n = Math.floor(n / 64);
  }
  return length != null
    ? base64.padStart(length, "0").slice(Math.max(base64.length - length, 0))
    : base64;
};

export const b64ToInt = (str: string): number => {
  let n = 0;
  for (const char of str) {
    n = n * 64 + BASE_64_CHARS.indexOf(char);
  }
  return n;
};
