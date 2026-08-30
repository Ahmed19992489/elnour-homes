import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_VM4tSBwN5PGd@ep-plain-rice-auzortld-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require",
  },
});
