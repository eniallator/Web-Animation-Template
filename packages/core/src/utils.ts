export function checkExhausted(value: never): never {
  throw new Error(`Value not exhausted: ${JSON.stringify(value)}`);
}

export function filterAndMap<I, O>(
  arr: readonly I[],
  mapper: (val: I, index: number, arr: readonly I[]) => O | null | undefined
): O[] {
  return arr.reduce((acc: O[], item, i, arr) => {
    const mapped = mapper(item, i, arr);
    return mapped != null ? [...acc, mapped] : acc;
  }, []);
}

export function findAndMap<I, O>(
  arr: readonly I[],
  mapper: (val: I, index: number, arr: readonly I[]) => O | null | undefined
): O | null {
  for (let i = 0; i < arr.length; i++) {
    const output = mapper(arr[i] as I, i, arr);

    if (output != null) {
      return output;
    }
  }
  return null;
}

export function formatDate(date: Date): string {
  return date
    .toLocaleString()
    .replace(
      /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
      "$<y>-$<m>-$<d>T$<t>"
    );
}

export function tuple<const T extends unknown[]>(...tuple: T): T {
  return tuple;
}

export function raise<T = never>(err: Error): T {
  throw err;
}

export type RemainingKeys<O extends object, T extends object> = Exclude<
  keyof O,
  keyof T
>;

export type Entry<O, K extends keyof O> = readonly [K, O[K]];

export function typedToEntries<O extends object>(obj: O): Entry<O, keyof O>[] {
  return Object.entries(obj) as unknown as Entry<O, keyof O>[];
}

export function typedFromEntries<O extends object>(
  entries: Entry<O, keyof O>[]
): O {
  return Object.fromEntries(entries) as O;
}

export function mapObject<const O extends object, const N extends object>(
  obj: O,
  mapper: (entry: Entry<O, keyof O>) => Entry<N, keyof N>
): N {
  return typedFromEntries(typedToEntries(obj).map(mapper));
}

export function posMod(a: number, b: number): number {
  return ((a % b) + b) % b;
}
