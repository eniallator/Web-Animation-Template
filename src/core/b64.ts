const BASE_64_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
export function intToBase64(n: number, length?: number): string {
  let base64Str = "";
  while (n) {
    base64Str = BASE_64_CHARS[((n % 64) + 64) % 64] + base64Str;
    n = n > 0 ? Math.floor(n / 64) : Math.ceil(n / 64);
  }
  return length != null
    ? base64Str
        .padStart(length, "0")
        .slice(Math.max(base64Str.length - length, 0))
    : base64Str;
}

export function base64ToPosInt(str: string): number {
  let n = 0;
  for (let char of str) {
    n = n * 64 + BASE_64_CHARS.indexOf(char);
  }
  return n;
}
