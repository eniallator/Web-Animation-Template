class IndexError extends Error {
  name = "IndexError" as const;
}

export const targetError = new IndexError("Target does not exist");
export const methodError = new IndexError(
  "Method name does not exist on target"
);

export class AuditError extends Error {
  name = "AuditError" as const;
}
