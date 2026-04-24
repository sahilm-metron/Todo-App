import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

// ...(process.env.VITEST ? [] : [reactRouter()])
export default defineConfig({
  plugins: [tailwindcss(), ...(process.env.VITEST ? [] : [reactRouter()])],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    pool: "threads",
  },
});
