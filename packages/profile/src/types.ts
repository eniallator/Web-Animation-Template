import type { MethodName, TargetName } from "./tagged.ts";

export type TimeableTarget = Record<string, () => unknown>;

export interface Timeable {
  name: TargetName;
  target: { prototype: TimeableTarget } & TimeableTarget;
  methodNames: MethodName[];
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
