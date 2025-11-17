import { defineConfig } from "vitest/config";

const mode = process.env.NODE_ENV ?? "development";

export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: "jsdom",
    ...(mode === "production" ? { maxWorkers: 1, reporters: "verbose" } : {}),
  },
});
