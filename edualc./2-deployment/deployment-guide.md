# 🚀 Deployment Guide: Option A (Vercel + Render)

This guide will help you deploy your **Rest-iN-U** for free using the "Option A" strategy.

---

## Phase 1: Database & Cache (The Foundation)

Before deploying the code, we need the storage ready.

## 1. PostgreSQL Database (Neon.tech)

*We use Neon because it offers a generous "Forever Free" tier, whereas Render's free database expires after 90 days.*

1.  Go to [Neon.tech](https://neon.tech) and sign up.

2.  Create a new project (e.g., `rest-in-u`).

3.  **Copy the Connection String** (it looks like `postgres://user:pass@...`).

4.  Save this; you will need it as `DATABASE_URL`.

{
    DATABASE_URL = postgresql://neondb_owner:npg_IFZQbAK17wXD@ep-restless-shadow-ah3b18us-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
}

## 2. Redis Cache (Upstash)

*We use Upstash for a free, serverless Redis instance.*

1.  Go to [Upstash.com](https://upstash.com) and sign up.

2.  Create a new Redis database.

3.  **Copy the REST URL and Token** or the `rediss://` connection string.

4.  Save this as `REDIS_URL`.

{
    REDIS_URL = "rediss://default:AbM8AAIncDE4MjA1OGRhZGU2YWY0Nzk4OTJhYzA1ZmZkZGI0OWVmMnAxNDU4ODQ@united-rhino-45884.upstash.io:6379"
}
---

## Phase 2: Backend & AI Service (Render)

We will deploy the Node.js Backend and Python AI Service to Render.

1.  **Push your code to GitHub** (if you haven't already).

2.  Go to [Render.com](https://render.com) and sign up.

3.  Click **New +** -> **Web Service**.

## Deploying the Main Backend (Node.js)

1.  Connect your GitHub repository.

2.  **Name:** `rest-in-u-backend`

3.  **Root Directory:** `backend` (Important!)

4.  **Runtime:** Node

5.  **Build Command:** `npm install && npm run build`

6.  **Start Command:** `npm start`

7.  **Environment Variables:** (Add these)

    *   `NODE_ENV` = `production`

    *   `DATABASE_URL` = *(Paste your Neon connection string)*

    *   `REDIS_URL` = *(Paste your Upstash connection string)*

    *   `JWT_SECRET` = *(Generate a random long string)*

    *   `AI_SERVICE_URL` = *(Leave empty for now, we will fill this after deploying AI)*

8.  Click **Create Web Service**.

## Deploying the AI Service (Python)

1.  Click **New +** -> **Web Service**.

2.  Connect the same repository.

3.  **Name:** `rest-in-u-ai`

4.  **Root Directory:** `backend`

5.  **Runtime:** Python 3

6.  **Build Command:** `pip install -r requirements.txt`

7.  **Start Command:** `gunicorn api_server:app`

8.  Click **Create Web Service**.

## 🔗 Link Them

1.  Once the **AI Service** is live, copy its URL (e.g., `https://rest-in-u-ai.onrender.com`).

2.  Go back to your **Main Backend** dashboard -> **Environment**.

3.  Edit `AI_SERVICE_URL` and paste the AI Service URL.

4.  **Save Changes** (this will redeploy the backend).

{
    AI_SERVICE_URL = https://rest-in-u-ai.onrender.com

    DATABASE_URL = postgresql://neondb_owner:npg_IFZQbAK17wXD@ep-restless-shadow-ah3bl8us-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

    ENCRYPTION_KEY = a1b2c3d4e5f6g7h8i9j0k112m3n4o5p6

    JWT_REFRESH_SECRET = your-very-long-random-secret-key-for-refresh-tokens-at-least-64-chars

    JWT_SECRET = 382947298347928374982374982374982374

    NODE_ENV = production

    REDIS_URL = rediss://default:AbM8AAIncDE4MjA1OGRhZGU2YWY0Nzk4OTJhYzA1ZmZkZGI0OVVmMnAxNDU4ODQ@united-rhino-45884.upstash.io:6379

}
---

## Phase 3: Frontend (Vercel)

Finally, deploy the Next.js frontend.

1.  Go to [Vercel.com](https://vercel.com) and sign up.

2.  Click **Add New...** -> **Project**.

3.  Import your GitHub repository.

4.  **Framework Preset:** Next.js (should be auto-detected).

5.  **Root Directory:** Click "Edit" and select `frontend`.

6.  **Environment Variables:**

    *   `NEXT_PUBLIC_API_URL` = *(Paste your Render Main Backend URL, e.g., https://rest-in-u-backend.onrender.com)*

    *   `NEXT_PUBLIC_WS_URL` = *(Same as above, but usually just the base URL works for Socket.io)*

7.  Click **Deploy**.

{
    NEXT_PUBLIC_API_URL = https://rest-in-u-backend.onrender.com
    NEXT_PUBLIC_WS_URL = https://rest-in-u-backend.onrender.com
}

---

## 🎉 Success!

Your app is now live!

*   **Frontend:** `https://your-project.vercel.app`

*   **Backend:** `https://rest-in-u-backend.onrender.com`

*   **AI:** `https://rest-in-u-ai.onrender.com`
