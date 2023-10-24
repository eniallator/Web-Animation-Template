export function checkExhausted(value: never): never {
  throw new Error(`Value not exhausted: ${JSON.stringify(value)}`);
}

export function replaceItem<T>(
  arr: Array<T>,
  index: number,
  item?: T
): Array<T> {
  const copy = [...arr];

  if (item != null) {
    copy.splice(index, 1, item);
  } else {
    copy.splice(index, 1);
  }

  return copy;
}

export function filterAndMap<I, O>(
  arr: I[],
  mapper: (val: I, index: number, arr: I[]) => O | null | undefined
): O[] {
  return arr.reduce((acc: O[], item, i, arr) => {
    const mapped = mapper(item, i, arr);
    return mapped != null ? [...acc, mapped] : acc;
  }, []);
}

export function formatDate(date: Date): string {
  return date
    .toLocaleString()
    .replace(
      /(?<d>\d+)\/(?<m>\d+)\/(?<y>\d+)[^\d]*(?<t>\d+:\d+).*/,
      "$<y>-$<m>-$<d>T$<t>"
    );
}
