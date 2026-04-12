export type Target = NonNullable<unknown> | null;

export interface Stats {
  calls: number;
  executionTime: number;
}

export interface RecordableStats extends Stats {
  minDebugLevel: number;
}

export type TargetMap<S extends Stats> = Map<
  Target,
  { targetName: string; methods: Record<PropertyKey, S> }
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (this: any, ...args: any[]) => unknown;

export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends AnyFunction ? K : never;
}[keyof T];
