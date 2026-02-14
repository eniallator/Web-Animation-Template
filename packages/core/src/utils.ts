export const raise = (error: Error): never => {
  throw error;
};

export const checkExhausted = (value: never) =>
  raise(new Error(`Value not exhausted: ${JSON.stringify(value)}`));

export type Attempt = {
  <T>(unsafeCb: () => T): T | null;
  <T>(unsafeCb: () => T, onError: () => T): T;
};

export const attempt: Attempt = <T>(
  unsafeCb: () => T,
  onError?: () => T
): T | null => {
  try {
    return unsafeCb();
  } catch {
    return onError?.() ?? null;
  }
};
