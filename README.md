# HireFlow

A simple Recruitment Management System — recruiters can manage job postings,
candidates, and move applicants through a hiring pipeline.

> **Status: Phase 1 — Project setup.** Authentication, Jobs, Candidates, the
> Hiring Pipeline, the Dashboard, and the AI Resume Matcher are being built in
> later phases. This README will be filled in fully (architecture diagram,
> API reference, screenshots, deployment steps) in Phase 10.

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios,
React Hook Form, Zod, Recharts, Lucide React

**Backend:** Node.js, Express, TypeScript, JWT auth, bcrypt

**Database:** MongoDB with Mongoose

## Project Structure

```
hireflow/
├── backend/          # Express + TypeScript REST API
│   └── src/
│       ├── config/       # env vars, db connection (Phase 2)
│       ├── controllers/  # request handlers
│       ├── middleware/   # auth, error handling, etc.
│       ├── models/       # Mongoose schemas
│       ├── routes/       # Express routers
│       ├── services/     # business logic
│       ├── validators/   # request validation
│       ├── utils/        # helpers
│       ├── app.ts        # Express app + middleware config
│       └── server.ts     # server startup
└── frontend/         # React + TypeScript SPA
    └── src/
        ├── components/   # reusable UI building blocks
        ├── pages/        # route-level pages
        ├── layouts/      # page layout wrappers (sidebar, navbar)
        ├── hooks/        # custom React hooks
        ├── services/     # API calls (Axios)
        ├── types/        # shared TypeScript types
        ├── utils/        # helpers
        └── lib/          # third-party integration glue
```

## Running Locally (Phase 1)

At this stage there is no database or authentication yet — this just proves
the frontend and backend are wired up correctly.

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs at `http://localhost:5000`. Check `http://localhost:5000/api/health`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`. You should see a HireFlow card that
says **"HireFlow API is running"** — confirming the frontend can reach the
backend.

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`. Never commit `.env`
files — they're excluded via `.gitignore`.

## Roadmap

- [x] Phase 1 — Project setup
- [ ] Phase 2 — Backend + MongoDB + User model
- [ ] Phase 3 — Authentication (JWT)
- [ ] Phase 4 — Jobs CRUD
- [ ] Phase 5 — Candidates CRUD
- [ ] Phase 6 — Hiring Pipeline (Kanban)
- [ ] Phase 7 — Dashboard + charts
- [ ] Phase 8 — AI Resume Matcher
- [ ] Phase 9 — Testing, security, error handling
- [ ] Phase 10 — Docker, full README, deployment prep
