import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
9: // =============================================================================
  {
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================
14: const PROJECT_ROOT = import.meta.dirname;
      if (code.includes("jsxDEV") || code.includes("jsx-dev-runtime")) {
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming
19: type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";
          map: null,
21: function ensureLogDir() {
      }
if (!fs.existsSync(LOG_DIR)) {
fs.mkdirSync(LOG_DIR, { recursive: true });
}
}
27: function trimLogFile(logPath: string, maxSize: number) {
export default defineConfig({
try {
if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
return;
}
33:     const lines = fs.readFileSync(logPath, "utf-8").split("\n");
      "@": path.resolve(import.meta.dirname, "client", "src"),
const keptLines: string[] = [];
let keptBytes = 0;
37:     // Keep newest lines (from end) that fit within 60% of maxSize
  },
const targetSize = TRIM_TARGET_BYTES;
for (let i = lines.length - 1; i >= 0; i--) {
const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
if (keptBytes + lineBytes > targetSize) break;
keptLines.unshift(lines[i]);
keptBytes += lineBytes;
}
46:     fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
    },
} catch {
/* ignore trim errors */
}
}
52: function writeToLogFile(source: LogSource, entries: unknown[]) {
      strict: true,
if (entries.length === 0) return;
55:   ensureLogDir();
  },
const logPath = path.join(LOG_DIR, `${source}.log`);
58:   // Format entries with timestamps

const lines = entries.map((entry) => {
const ts = new Date().toISOString();

























































































};
}
153: const plugins = [

react({ jsxRuntime: "automatic", dev: false }),
tailwindcss(),
vitePluginManusRuntime(),
// @vitejs/plugin-react emits jsxDEV calls from react/jsx-dev-runtime in SSR
// builds even with dev:false; rewrite both the import specifier and the call
// names so the bundle resolves to the production jsx runtime.
{
name: "manus-ssr-jsx-runtime-fix",
enforce: "post",
transform(code, id) {
if (id.includes("dist/server-ssr")) return undefined;
if (code.includes("jsxDEV") || code.includes("jsx-dev-runtime")) {
return {
// If this module already imports the prod jsx runtime (e.g. mixed
// DEV/prod output), merge: import jsxDEV becomes jsx in the existing
// specifier, otherwise rewrite the dev-runtime specifier itself.
code: code
.replace(/from\s+"react\/jsx-dev-runtime"/g, 'from "react/jsx-runtime"')
.replace(/jsxDEV/g, "jsx"),
map: null,
};
}
return undefined;
},
},
];
181: export default defineConfig({

mode: "production",
plugins,
resolve: {
alias: {
// SSR bundle must use the production jsx runtime — @vitejs/plugin-react
// emits jsxDEV imports from react/jsx-dev-runtime in SSR builds, but the
// deployed Node runtime has no dev runtime dependency; the prod jsx
// runtime is functionally identical for renderToString output.
"react/jsx-dev-runtime": "react/jsx-runtime",
"@": path.resolve(import.meta.dirname, "client", "src"),
"@shared": path.resolve(import.meta.dirname, "shared"),
"@assets": path.resolve(import.meta.dirname, "attached_assets"),
},
},
envDir: path.resolve(import.meta.dirname),
root: path.resolve(import.meta.dirname, "client"),
build: {
ssr: path.resolve(import.meta.dirname, "client", "src", "entry-server.tsx"),
outDir: path.resolve(import.meta.dirname, "dist", "server-ssr"),
emptyOutDir: true,
rollupOptions: {
output: { entryFileNames: "entry-server.js" },
},
},
publicDir: path.resolve(import.meta.dirname, "client", "public"),
server: {
host: true,
allowedHosts: [
".manuspre.computer",
".manus.computer",
".manus-asia.computer",
".manuscomputer.ai",
".manusvm.computer",
"localhost",
"127.0.0.1",
],
fs: {
strict: true,
deny: ["**/.*"],
},
},
});
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.