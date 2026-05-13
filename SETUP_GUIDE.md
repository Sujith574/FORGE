# FORGE — Setup Guide

Complete these steps in order to get the backend running.

---

## STEP 1 — Set Up Supabase

**You need to do this manually in the browser.**

1. Go to [https://supabase.com](https://supabase.com) → **New Project**
2. Name it `forge` — pick a region close to your users
3. Wait for it to provision (~2 minutes)
4. Go to **SQL Editor** → **New Query**
5. Open `supabase/schema.sql` from this project and paste the entire contents
6. Click **Run** — all 5 tables will be created with RLS enabled

**Get your keys:**
- Supabase Dashboard → **Settings** → **API**
- Copy: `Project URL`, `anon public key`, `service_role secret`

---

## STEP 2 — Set Up Environment Variables

In the `FORGE` folder, create a file called `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
NODE_ENV=development
```

**Where to get these:**
- `ANTHROPIC_API_KEY` → [console.anthropic.com](https://console.anthropic.com)
- Supabase keys → Your Supabase project → Settings → API

> ⚠️ **Never commit `.env.local` to Git.** It is already in `.gitignore`.

---

## STEP 3 — Install Dependencies

```bash
npm install
```

---

## STEP 4 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll see the FORGE placeholder page.

Test an API route: in Postman or curl, hit:
```
GET http://localhost:3000/api/users/me
Authorization: Bearer <your-supabase-jwt>
```

---

## STEP 5 — Connect to Supabase Auth

In your frontend (React app), use:
```js
import { supabase } from '@/lib/supabase/client';

// Sign up
await supabase.auth.signUp({ email, password });

// Sign in
const { data } = await supabase.auth.signInWithPassword({ email, password });
const token = data.session.access_token;

// Use token in all API calls:
fetch('/api/users/me', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## STEP 6 — Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Add all 4 environment variables in Vercel's **Environment Variables** settings
4. Deploy — done

---

## API Reference (Quick)

| Method | Route | What it does |
|--------|-------|-------------|
| GET | `/api/users/me` | Get current user or `{ needsOnboarding: true }` |
| POST | `/api/users/onboard` | Save name + company, create nodes + starter logs |
| GET | `/api/nodes` | Get all Brain Map nodes |
| POST | `/api/nodes` | Create a new node |
| PATCH | `/api/nodes/:id` | Update node (position, status, connections) |
| DELETE | `/api/nodes/:id` | Delete node + its work items |
| GET | `/api/nodes/:id/work` | Get work items for a node |
| POST | `/api/nodes/:id/work` | Add a work item to a node |
| GET | `/api/documents` | Get all document fields |
| PUT | `/api/documents` | Save (upsert) one field |
| GET | `/api/logs` | Get all Decision Logs |
| POST | `/api/logs/generate` | Generate a new Decision Log via Claude |
| PATCH | `/api/logs/:id/accept` | Accept a log |
| PATCH | `/api/logs/:id/reject` | Reject — Claude revises or pushes back |
| POST | `/api/warroom/message` | War Room chat message |

---

## Project Structure

```
FORGE/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── users/
│   │   │   │   ├── me/route.js          ← GET /api/users/me
│   │   │   │   └── onboard/route.js     ← POST /api/users/onboard
│   │   │   ├── nodes/
│   │   │   │   ├── route.js             ← GET, POST /api/nodes
│   │   │   │   └── [id]/
│   │   │   │       ├── route.js         ← PATCH, DELETE /api/nodes/:id
│   │   │   │       └── work/route.js    ← GET, POST /api/nodes/:id/work
│   │   │   ├── documents/route.js       ← GET, PUT /api/documents
│   │   │   ├── logs/
│   │   │   │   ├── route.js             ← GET /api/logs
│   │   │   │   ├── generate/route.js    ← POST /api/logs/generate
│   │   │   │   └── [id]/
│   │   │   │       ├── accept/route.js  ← PATCH /api/logs/:id/accept
│   │   │   │       └── reject/route.js  ← PATCH /api/logs/:id/reject
│   │   │   └── warroom/
│   │   │       └── message/route.js     ← POST /api/warroom/message
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── globals.css
│   └── lib/
│       ├── supabase/
│       │   ├── client.js    ← Browser client (anon key)
│       │   └── admin.js     ← Server client (service key)
│       ├── auth/
│       │   └── getAuthUser.js  ← JWT verification middleware
│       └── claude/
│           └── claudeService.js  ← All 4 Claude situations
├── supabase/
│   └── schema.sql           ← Run once in Supabase SQL Editor
├── .env.local.example       ← Copy to .env.local and fill in
├── .gitignore
└── next.config.js
```
