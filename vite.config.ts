import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/AnnualPDHours/",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { charts: ["recharts"], motion: ["motion/react"] },
      },
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
