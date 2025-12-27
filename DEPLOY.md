# Deployment Checklist

Since your app is already live on Vercel and connected to Render, you just need to sync the changes.

## 1. Upgrade Render Database (Run this Locally)
You need to tell Prisma to update your **remote** Render database, not your local one. Run this **exact command** in your terminal:

```bash
# Replace [YOUR_CONNECTION_STRING] with the one from Render Dashboard
DATABASE_URL="[YOUR_CONNECTION_STRING]" npx prisma db push
```

*(This command temporarily points Prisma to your Render DB just for this update)*

## 2. Update Environment
Go to your **Vercel Dashboard > Settings > Environment Variables** and add your new AI key:

*   **Key**: `GOOGLE_API_KEY`
*   **Value**: (Copy from your local `.env`)

## 3. Deploy Code
Push your changes to GitHub to trigger a redeploy:

```bash
git add .
git commit -m "Add Locations and Gemini AI"
git push
```

**Done!** Vercel will rebuild the app, and it will be live with the new features in a few minutes.
