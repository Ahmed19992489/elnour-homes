import type { Express } from "express";
import express from "express";
import path from "node:path";
import fs from "node:fs";

export function registerStorageProxy(app: Express) {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use("/uploads", express.static(uploadsDir));
}
