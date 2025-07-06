export type MethodName = string | symbol;

export interface Stats {
  calls: number;
  executionTime: number;
}

export interface RecordableStats extends Stats {
  minDebugLevel: number;
}

export type TargetMap<S> = Map<
  NonNullable<unknown>,
  { targetName: string; methods: Record<MethodName, S> }
>;
