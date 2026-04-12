export type MethodName = string | symbol;

export interface Stats {
  calls: number;
  executionTime: number;
}

export interface RecordableStats extends Stats {
  minDebugLevel: number;
}

export type TargetMap<S extends Stats> = Map<
  NonNullable<unknown> | null,
  { targetName?: string; methods: Record<MethodName, S> }
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => unknown;
