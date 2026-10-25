# StatVerse

StatVerse is a full-stack statistical analysis platform built with Next.js App Router, React, TypeScript, Prisma, and Neon PostgreSQL. It includes authenticated analysis, dataset persistence, hypothesis testing, regression, history, reports, and learning tools.

## Requirements

- Node.js 20.19 or later (required by Prisma 7; Next.js 16 requires 20.9)
- A Neon PostgreSQL project

## Local setup

1. Install dependencies: `npm install`
2. Create `.env` from the example:

   ```powershell
   Copy-Item .env.example .env
   ```

3. In Neon, create a separate development database or branch. Set the environment variables described below in `.env`; use its pooled URL for `DATABASE_URL` and its direct (non-pooled) URL for `DIRECT_URL`.
4. Generate Prisma Client and apply migrations to the development database:

   ```powershell
   npm.cmd run db:generate
   npm.cmd run db:migrate
   ```

5. Start the app with `npm.cmd run dev`, then open http://localhost:3000.
6. Choose **Create account** to register.

Do not point development migration commands at a production database.

## Neon and Vercel environment variables

In Neon, copy the connection strings from the project dashboard. In Vercel, open **Project → Settings → Environment Variables** and add the following values for the appropriate environments:

- `DATABASE_URL`: Neon pooled connection string (the hostname normally contains `-pooler`). Used by application requests through the Neon serverless adapter.
- `DIRECT_URL`: Neon direct, non-pooled connection string. Used by Prisma migration commands, which need a direct database connection.
- `SESSION_SECRET`: a private random value of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Keep these values server-side. Do not use `NEXT_PUBLIC_` prefixes, commit `.env`, or paste credentials into source code. `.env` is ignored by Git. Use distinct Neon branches/databases for development and production.

## Safe PostgreSQL migration

The previous local database is `prisma/statverse.db`. It and the original SQLite migration history under `prisma/migrations/` are retained and are not used by the PostgreSQL migration configuration. PostgreSQL has its own migration history under `prisma/migrations-postgresql/`; the PostgreSQL baseline was generated from the current Prisma schema.

Before applying the baseline to any Neon database, inspect that database's existing tables and migration state. Do not assume it is empty. If it already contains application tables or data, stop and compare its schema with the Prisma schema before applying anything. Never run `prisma migrate reset` or apply the SQLite migration to Neon.

After confirming the intended Neon development database is empty, apply migrations there using `npm.cmd run db:migrate`. Review and test that result before applying the committed PostgreSQL migrations to the production Neon database with `npm.cmd run db:deploy`. Vercel builds generate Prisma Client; migrations should be run as a deliberate deployment step, not on each serverless invocation.

The SQLite database is preserved as a backup; its user and application records are not automatically copied to Neon. Data transfer needs a separately reviewed, non-destructive import plan.

## Build and deployment

The build runs `prisma generate` before `next build`. In Vercel, configure `DATABASE_URL`, `DIRECT_URL`, and `SESSION_SECRET`, then deploy. Apply reviewed PostgreSQL migrations before directing users to the deployed app. Do not claim deployment or remote database migration succeeded until the deployed app and database have actually been checked.

## Application routes

- `/`: animated sign-in and registration
- `/dashboard`: user-specific statistics, activity, and analysis shortcuts
- `/regression`, `/hypothesis`: statistical analysis with saved results
- `/data-explorer`: CSV exploration and persistent datasets
- `/history`: reopen, delete, and export saved analyses
- `/learning`, `/settings`: learning tools, profile, account, and theme preferences

API handlers authenticate using a signed, HttpOnly cookie. Passwords are hashed with bcrypt, requests are validated with Zod, and database reads/writes are scoped to the authenticated user.
