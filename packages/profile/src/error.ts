export class IndexError extends Error {
  name = "IndexError" as const;
}

export class AuditError extends Error {
  name = "AuditError" as const;
}
