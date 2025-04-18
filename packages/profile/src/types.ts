export interface Timeable {
  name: string;
  target: { prototype: Record<string, () => unknown> } & Record<
    string,
    () => unknown
  >;
  methodNames: string[];
  minDebugLevel: number;
}

export interface TimeableStats {
  calls: number;
  totalExecutionTime: number;
  minDebugLevel: number;
  setup: boolean;
}

export interface Stats {
  calls: number;
  totalExecutionTime: number;
  minDebugLevel: number;
}
