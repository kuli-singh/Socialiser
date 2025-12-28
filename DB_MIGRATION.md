# Database Migration: Render to Vercel Postgres

This guide will help you move your data from Render to Vercel's built-in Postgres database.

## Prerequisites
- **Render Connection String**: Find this in your Render Dashboard > specific database > Connect > External Connection String.
- **Vercel Postgres**: Created in your Vercel Dashboard > Storage.

## Step 1: Export Data from Render (Dump)
Run this command in your local terminal to download your data from Render. 
**Replace `[RENDER_CONNECTION_STRING]` with your actual URL.**

```bash
pg_dump "[RENDER_CONNECTION_STRING]" -O -x --clean --if-exists -f render_backup.sql
```
*Note: If you don't have `pg_dump` installed, enable it via `brew install libpq` on Mac.*

## Step 2: Import Data to Vercel (Restore)
Get your Vercel Postgres connection string from the Vercel Dashboard (.env.local tab).
**Replace `[VERCEL_CONNECTION_STRING]` with your actual URL.**

```bash
psql "[VERCEL_CONNECTION_STRING]" -f render_backup.sql
```

## Step 3: Update Vercel Environment
1. Go to **Vercel Dashboard > Settings > Environment Variables**.
2. Find `DATABASE_URL`.
3. Update it to match your **Vercel Postgres** `POSTGRES_PRISMA_URL` (or `POSTGRES_URL_NON_POOLING` if you use direct connections).
4. **Redeploy** your application (or just visit the deployment page and click "Redeploy").

## Step 4: Verify
1. Log into your app.
2. Check if your old data (friends, activities) is present.
