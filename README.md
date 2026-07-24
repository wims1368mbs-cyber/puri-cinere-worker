# puri-cinere-worker

Cloudflare Worker (TypeScript + [Hono](https://hono.dev)) REST API for the Puri Cinere doctor-visit monitoring dashboard, backed by Cloudflare D1 (serverless SQLite). Replaces the archived Go+MySQL backend ([puri-cinere-backend](https://github.com/wims1368mbs-cyber/puri-cinere-backend), kept for reference) so the whole stack can run on Cloudflare's free tier.

## First-time setup

```
npm install
npx wrangler login          # opens a browser to authorize this machine with your Cloudflare account
npx wrangler d1 create puri-cinere-db
```

Copy the `database_id` from the output of `d1 create` into `wrangler.toml` (`d1_databases[0].database_id`), then apply the schema:

```
npm run db:migrate:remote
```

For local development, also run the migration against the local D1 emulator:

```
npm run db:migrate:local
```

Set a real JWT secret instead of the `dev-secret-change-me` placeholder in `wrangler.toml`:

```
npx wrangler secret put JWT_SECRET
```

## Run locally

```
npm run dev
```

Serves on `http://localhost:8787`.

## Deploy

```
npm run deploy
```

Or connect this repo to Cloudflare's dashboard (Workers & Pages → Create → Connect to Git) for auto-deploy on every push to `main`.

## API

Same endpoint shape as the original spec in [../puri-cinere/docs/TECHNICAL_SPEC.md](../puri-cinere/docs/TECHNICAL_SPEC.md), reimplemented against D1's SQLite dialect (see `migrations/0001_init.sql`).
