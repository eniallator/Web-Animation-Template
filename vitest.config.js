import { defineConfig } from "vitest/config";

const mode = process.env.NODE_ENV ?? "development";

export default defineConfig({
  test:
    mode === "production"
      ? {
          watch: false,
          isolate: true,
          passWithNoTests: true,
          environment: "jsdom",
          fileParallelism: false,
          reporters: "verbose",
        }
      : {
          watch: false,
          isolate: true,
          passWithNoTests: true,
          environment: "jsdom",
        },
});
