import { raise } from "./utils.ts";

type Zippable = readonly [unknown[], unknown[], ...unknown[][]];

type ZippedItem<Z extends Zippable> = {
  [K in keyof Z]: Z[K] extends readonly (infer T)[] ? T : Z[K];
};

export const zip = <const Z extends Zippable>(...toZip: Z): ZippedItem<Z>[] =>
  toZip.every(arr => arr.length === toZip[0].length)
    ? toZip[0].map((_, i) => toZip.map(arr => arr[i]) as ZippedItem<Z>)
    : raise(new Error("Zip index out of bounds"));
