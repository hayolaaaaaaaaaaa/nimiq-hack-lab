# Deployment

## Vercel

1. Import the repository.
2. Use `npm run build` as the build command.
3. Use `dist` as the output directory.
4. Configure `DATABASE_URL`, `SESSION_SECRET`, `DAILY_SECRET`, `WEB_ORIGIN`, and `COOKIE_SAME_SITE`.
5. Deploy the `master` branch.

The production client uses `/api` as its same-origin API URL. Local development uses `http://localhost:8787`.

## Verification

```bash
npm run build
npm run typecheck:server
npm test
```

Use a durable Postgres database in production. The SQLite fallback is for local development and ephemeral environments only.
