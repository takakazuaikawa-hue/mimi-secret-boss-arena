import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("motion")) return "motion";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("xstate")) return "state";
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "node",
  },
});
