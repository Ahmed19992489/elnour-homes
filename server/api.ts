import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import * as db from "./db";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded images directly from database with high-performance CDN cache headers
app.get(["/api/uploads/:id", "/uploads/:id"], async (req, res) => {
  try {
    const rawId = req.params.id.split(".")[0];
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return res.status(400).send("Invalid image id");
    }
    const media = await db.getUploadedMediaById(id);
    if (!media) {
      return res.status(404).send("Image not found");
    }
    const base64Data = media.data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    res.setHeader("Content-Type", media.contentType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    res.setHeader("Content-Length", buffer.length);
    return res.end(buffer);
  } catch (err) {
    console.error("[Media] Error serving uploaded media:", err);
    return res.status(500).send("Server error");
  }
});

app.use(
  ["/api/trpc", "/trpc"],
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.get(["/api/health", "/health", "/api"], (_req, res) => {
  res.json({ status: "ok", service: "elnour-homes-api" });
});

export default app;
