# Database Migration Guide: Render to Vercel Postgres

This guide will help you move your data from Render to your new Vercel Postgres database.

## 🛠️ Prerequisites
1.  **Render Connection String**:
    *   Go to your [Render Dashboard](https://dashboard.render.com).
    *   Select your Database.
    *   Scroll to **Connect** and copy the **External Connection String**.
2.  **Vercel Connection String**:
    *   Go to your [Vercel Dashboard](https://vercel.com).
    *   Open your project > **Storage** > Select your Postgres DB.
    *   Copy the **POSTGRES_URL**.
3.  **Command Line Tools**:
    *   You need `pg_dump` and `psql` (version 16 or higher).
    *   **Fixing Version Mismatch**: If you see "server version mismatch", run:
        ```bash
        brew install postgresql@16
        brew link --overwrite postgresql@16
        ```
        *Then restart your terminal.*

---

## 🚀 Step-by-Step Migration

### 1. Export Schema + Data from Render
The command I gave you (`pg_dump`) automatically includes **both** the schema (table structure) and the data.
```bash
# Replace [RENDER_URL] with your actual Render External Connection String
pg_dump "[RENDER_URL]" -O -x --clean --if-exists -f backup.sql
```
*Note: The `--clean --if-exists` flags are what "clear" the destination database before importing.*

### 2. (Optional) Manual Clear / Reset Vercel DB
If you want to completely wipe the Vercel DB and start fresh with just the schema (before importing data), run:
```bash
DATABASE_URL="[VERCEL_URL]" npx prisma db push --force-reset
```
> [!WARNING]
> This will permanently delete all data in the Vercel DB.

### 3. Import Everything
Run this to apply the schema and data from your backup file:
```bash
# Replace [VERCEL_URL] with your Vercel POSTGRES_URL
psql "[VERCEL_URL]" -f backup.sql
```

### 3. Sync Schema (Prisma)
To ensure everything is perfectly aligned with your code, run:
```bash
DATABASE_URL="[VERCEL_URL]" npx prisma db push
```

### 4. Update Vercel Environment
1.  Go to **Vercel Dashboard > Settings > Environment Variables**.
2.  Update `DATABASE_URL` to your new Vercel connection string.
3.  **Redeploy** the app to apply the change.

---

## ⚠️ Important Note
The `pg_dump` captures only the **data** and **structure**. It won't affect any files or your source code. Once imported, your app will pick up right where it left off!
