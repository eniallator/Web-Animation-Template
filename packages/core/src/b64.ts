const BASE_64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export const uintToB64 = (n: number, length?: number): string => {
  let base64 = "";
  while (n && (length == null || base64.length < length)) {
    base64 = (BASE_64_CHARS[n % 64] ?? "") + base64;
    n = Math.floor(n / 64);
  }
  return length != null ? base64.padStart(length, BASE_64_CHARS[0]) : base64;
};

export const b64ToUint = (str: string): number => {
  let n = 0;
  for (const char of str) {
    n = n * 64 + BASE_64_CHARS.indexOf(char);
  }
  return n;
};
