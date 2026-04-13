import { defineConfig } from "vitest/config";

const mode = process.env.NODE_ENV ?? "development";

export default defineConfig({
  test: {
    watch: false,
    isolate: true,
    passWithNoTests: true,
    environment: "jsdom",
  },
});
