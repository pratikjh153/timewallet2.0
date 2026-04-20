# Time Wallet

Track your day as a finite monetary asset. Every second has a cost; logging productive work converts spent time into invested time.

Built with Next.js 16, React 19, Prisma 7, and SQLite (via `better-sqlite3`).

## Getting started

```bash
cp .env.example .env
npm install
npm run db:migrate   # applies Prisma migrations and generates the client
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Name           | Description                                          | Example                                |
| -------------- | ---------------------------------------------------- | -------------------------------------- |
| `DATABASE_URL` | SQLite connection string (libSQL / Postgres also ok) | `file:./prisma/dev.db`                 |

See `.env.example` for more examples.

## Scripts

| Script               | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Next.js dev server                                   |
| `npm run build`      | Production build                                     |
| `npm run start`      | Start the production server                          |
| `npm run lint`       | ESLint                                               |
| `npm run typecheck`  | TypeScript type check                                |
| `npm run db:migrate` | Create + apply a new migration locally               |
| `npm run db:deploy`  | Apply existing migrations (use this in CI / on prod) |
| `npm run db:studio`  | Open Prisma Studio                                   |

## Deployment notes

This app persists data in a SQLite file. A few implications:

- **Works on**: any host with a persistent filesystem — Fly.io, Railway, Render, a VPS, or your own box. Mount a volume at a stable path and point `DATABASE_URL` at it (e.g. `file:/data/time-wallet.db`).
- **Does not work on Vercel / Netlify / other serverless hosts** as-is — their filesystem is read-only or ephemeral per invocation, so writes would be lost. For those you need to swap to Postgres, Turso / libSQL, or another network-accessible database. Update `provider` in `prisma/schema.prisma` and re-run `db:migrate`.

On the target host:

```bash
npm ci
npm run db:deploy
npm run build
npm run start
```

## Known limitations

- **Single-user.** The app has no authentication — there is one global `UserSettings` row and tasks aren't scoped to users. Don't expose a publicly-reachable instance. Adding auth (Clerk, Auth.js, Lucia, etc.) requires a product decision and schema changes (add `userId` to every model).
- Time ranges are minute-precision (`HH:mm`) and cannot cross midnight.
