# StatVerse

StatVerse is a full-stack statistical analysis platform built with Next.js App Router, React, TypeScript, Prisma, and SQLite. It includes authenticated analysis, dataset persistence, hypothesis testing, regression, history, reports, and learning tools.

## Requirements

- Node.js 20.19 or later (required by Prisma 7; Next.js 16 requires 20.9)
- No database server is required. SQLite stores data in a local file.

## Local setup

1. Install dependencies: `npm install`
2. Create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env`.
3. Set `SESSION_SECRET` in `.env` to a random secret of at least 32 characters. The example `DATABASE_URL` uses a local SQLite file and normally needs no changes.
4. Generate Prisma Client and apply migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Start or restart the app: `npm run dev`, then open http://localhost:3000.
6. Choose **Create account** to register. Accounts from the former localStorage demo are not present in the database.

### Windows PowerShell

If PowerShell reports that `npm.ps1` cannot run because script execution is disabled, use the Windows command launcher (`npm.cmd`) instead:

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run dev
```

For production deployments, set the same environment variables, run `npm run db:deploy`, then `npm run build` and `npm start`.

## Environment variables

- `DATABASE_URL`: SQLite file URL. The default `file:./prisma/statverse.db` stores the database locally in the Prisma folder.
- `SESSION_SECRET`: random secret used to sign the HttpOnly authentication cookie. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

The production build runs `prisma generate`. Database migrations are committed under `prisma/migrations`. The SQLite database file is local and ignored by git.

The previous demo stored accounts and analyses only in browser `localStorage`; that data is not automatically imported into SQLite. Create a new account after setup and retain/export any demo-only records before switching.

## Application routes

- `/`: animated sign-in and registration
- `/dashboard`: user-specific statistics, activity, and analysis shortcuts
- `/regression`, `/hypothesis`: statistical analysis with saved results
- `/data-explorer`: CSV exploration and persistent datasets
- `/history`: reopen, delete, and export saved analyses
- `/learning`, `/settings`: learning tools, profile, account, and theme preferences

API handlers authenticate using a signed, HttpOnly cookie. Passwords are hashed with bcrypt, requests are validated with Zod, and database reads/writes are scoped to the authenticated user.
