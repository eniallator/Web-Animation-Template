import { unsafeTag } from "@web-art/core";

export const unsafeTargetName = unsafeTag<string, "TargetName">();
export type TargetName = ReturnType<typeof unsafeTargetName>;

export const unsafeMethodName = unsafeTag<string | symbol, "MethodName">();
export type MethodName = ReturnType<typeof unsafeMethodName>;
