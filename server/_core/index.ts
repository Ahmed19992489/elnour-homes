import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { openAccountNotificationStream } from "../notificationStream";
import { serveStatic, setupVite } from "./vite";
14: function isPortAvailable(port: number): Promise<boolean> {

return new Promise(resolve => {
const server = net.createServer();
server.listen(port, () => {
server.close(() => resolve(true));
});
server.on("error", () => resolve(false));
});
}
24: async function findAvailablePort(startPort: number = 3000): Promise<number> {

for (let port = startPort; port < startPort + 20; port++) {
if (await isPortAvailable(port)) {
return port;
}
}
throw new Error(`No available port found starting from ${startPort}`);
}
33: async function startServer() {

const app = express();
const server = createServer(app);
// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
// tRPC API
app.use(
"/api/trpc",
createExpressMiddleware({
router: appRouter,
createContext,
})
);
app.get("/api/notifications/stream", async (req, res) => {
try {
const user = await sdk.authenticateRequest(req);
if (!user) return res.status(401).json({ error: "authentication_required" });
openAccountNotificationStream(req, res, user.id);
} catch {
res.status(401).json({ error: "authentication_required" });
}
});
// development mode uses Vite, production mode uses static files
if (process.env.NODE_ENV === "development") {
await setupVite(app, server);
} else {
serveStatic(app);
}
65:   const preferredPort = parseInt(process.env.PORT || "3000");

const port = await findAvailablePort(preferredPort);
68:   if (port !== preferredPort) {

console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
}
72:   server.listen(port, () => {

console.log(`Server running on http://localhost:${port}/`);
});
}
77: startServer().catch(console.error);

The above content shows the entire, complete file contents of the requested file.