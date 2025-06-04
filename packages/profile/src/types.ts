import type { AnyFunction } from "@web-art/core";

export type Property = string | symbol;
export type TimeableTarget = Record<Property, AnyFunction>;

export interface Stats {
  calls: number;
  executionTime: number;
}

export interface RecordableStats extends Stats {
  minDebugLevel: number;
}

export type AllStats<S> = Map<
  TimeableTarget,
  { targetName: string; properties: Record<Property, S> }
>;
