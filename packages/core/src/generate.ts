export function* generator<T>(
  callback: () => T | null | undefined
): Generator<T> {
  let result: T | null | undefined;
  while ((result = callback()) != null) yield result;
}
