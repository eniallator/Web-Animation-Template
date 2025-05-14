import { raise } from "@web-art/core";

import { methodError, targetError } from "./error.ts";
import { unsafeMethodName, unsafeTargetName } from "./tagged.ts";

import type { MethodName, TargetName } from "./tagged.ts";

export function safeAccess<T>(
  rec: Record<TargetName, Record<MethodName, T>>,
  targetName: TargetName
): Record<MethodName, T>;
export function safeAccess<T>(
  rec: Record<TargetName, Record<MethodName, T>>,
  targetName: TargetName,
  methodName: MethodName
): T;
export function safeAccess<T>(
  rec: Record<TargetName, Record<MethodName, T>>,
  targetName: TargetName,
  methodName?: MethodName
): T | Record<MethodName, T> {
  const methodRec = rec[unsafeTargetName(targetName)] ?? raise(targetError);
  return methodName != null
    ? (methodRec[unsafeMethodName(methodName)] ?? raise(methodError))
    : methodRec;
}
