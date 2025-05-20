import type { MethodName } from "./tagged.ts";

export type TimeableTarget = Record<MethodName, () => unknown>;

export interface Stats {
  calls: number;
  executionTime: number;
}

export interface TimeableStats extends Stats {
  minDebugLevel: number;
  setup: boolean;
}
