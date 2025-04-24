import { raise } from "@web-art/core";

import { methodError, targetError } from "./error.ts";
import { unsafeMethodName, unsafeTargetName } from "./tagged.ts";

import type { MethodName, TargetName } from "./tagged.ts";

export const safeAccess = <T>(
  rec: Record<TargetName, Record<MethodName, T>>,
  targetName: string,
  methodName: string
): T =>
  (rec[unsafeTargetName(targetName)] ?? raise(targetError))[
    unsafeMethodName(methodName)
  ] ?? raise(methodError);
