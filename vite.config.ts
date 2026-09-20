import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom"],
          // UI component library (Radix)
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-switch",
            "@radix-ui/react-slider",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-menubar",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-progress",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-separator",
            "@radix-ui/react-label",
            "@radix-ui/react-avatar",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-slot",
          ],
          // Charts library
          "vendor-charts": ["recharts"],
          // Animation library
          "vendor-motion": ["framer-motion"],
          // PDF/Excel export (heavy, rarely used)
          "vendor-export": ["jspdf", "xlsx", "html2canvas", "html2pdf.js"],
          // Data fetching
          "vendor-query": [
            "@tanstack/react-query",
            "@trpc/client",
            "@trpc/react-query",
          ],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});