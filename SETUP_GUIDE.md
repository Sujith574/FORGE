# FORGE — Setup Guide (MongoDB Version)

Complete these steps in order to get the backend running.

---

## STEP 1 — Set Up MongoDB

**You need to do this manually in the browser.**

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) → **Sign Up**
2. Create a **Free Cluster** (M0)
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) for development, or your Render IP for production.
4. Under **Database Access**, create a user with a password.
5. Go to **Database** → **Connect** → **Drivers** → Copy the `connection string`.

---

## STEP 2 — Set Up Environment Variables

In the `FORGE` folder, create a file called `.env.local`:

```
GROQ_API_KEY=gsk_...
MONGODB_URI=mongodb+srv://<user>:<password>@cluster...
JWT_SECRET=your_random_string
NODE_ENV=development
```

**Where to get these:**
- `GROQ_API_KEY` → [console.groq.com](https://console.groq.com)
- `MONGODB_URI` → MongoDB Atlas Dashboard
- `JWT_SECRET` → Run `openssl rand -base64 32` or type a long random string.

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

---

## STEP 5 — Deploy to Render

1. Push this folder to your GitHub repo (`Sujith574/FORGE`)
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Select the repo.
4. Render will use `render.yaml` automatically.
5. Add the environment variables in the Render dashboard.

---

## API Reference (Quick)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Register + get token |
| POST | `/api/auth/login` | Login + get token |
| GET | `/api/users/me` | Get profile + onboarding status |
| POST | `/api/users/onboard` | Create default nodes + starter logs |
| GET | `/api/nodes` | Get all Brain Map nodes |
| POST | `/api/nodes` | Create a new node |
| PATCH | `/api/nodes/:id` | Update node |
| DELETE | `/api/nodes/:id` | Delete node + work items |
| GET | `/api/nodes/:id/work` | Get work items |
| POST | `/api/nodes/:id/work` | Add work item |
| GET | `/api/documents` | Get all document fields |
| PUT | `/api/documents` | Upsert one field |
| GET | `/api/logs` | Get all Decision Logs |
| POST | `/api/logs/generate` | Generate log via Groq |
| PATCH | `/api/logs/:id/accept` | Accept a log |
| PATCH | `/api/logs/:id/reject` | Reject (Revise or Pushback) |
| POST | `/api/warroom/message` | War Room chat |
