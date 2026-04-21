import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI (migrate, db push) needs a direct Postgres connection. On Supabase,
// set DIRECT_URL to session pooler :5432 or `db.<ref>.supabase.co:5432`, and use
// transaction pooler :6543 (+ `pgbouncer=true`) for DATABASE_URL in lib/db.ts only.
const migrateUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/time_wallet";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrateUrl,
  },
  migrations: {
    path: "prisma/migrations",
  },
});
