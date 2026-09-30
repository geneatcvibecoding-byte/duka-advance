import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct connection: Supabase's transaction pooler
    // (pgbouncer) cannot run the DDL and advisory locks that migrations use.
    // Falls back to DATABASE_URL for plain Postgres without a pooler.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
