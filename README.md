# HireFlow

HireFlow is a full-stack recruitment management application for organizing job openings, tracking candidates, and reviewing hiring activity. Recruiters can move candidates through a six-stage pipeline and see current activity in a dashboard.

## Features

- JWT authentication with recruiter accounts and protected API routes
- Create, search, filter, update, and delete job openings
- Candidate records linked to jobs, with skills, experience, resume text, notes, and hiring stage
- Drag-and-drop hiring pipeline with optimistic stage updates
- Dashboard with job and candidate totals, stage and job charts, and recent candidates
- Responsive navigation and layouts for desktop and mobile
- Demo data seeding for a recruiter, six jobs, and fifteen candidates

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, dnd-kit
- Backend: Node.js, Express, TypeScript, express-rate-limit
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT and bcrypt

## Folder Structure

```text
hireflow/
|-- backend/
|   |-- src/
|   |   |-- config/          # Environment and database configuration
|   |   |-- controllers/     # HTTP request handlers
|   |   |-- events/          # In-process domain events
|   |   |-- lib/             # Shared Prisma client
|   |   |-- middleware/      # Authentication, authorization, and errors
|   |   |-- routes/          # Express route definitions
|   |   |-- scripts/         # Benchmark and maintenance scripts
|   |   |-- services/        # Reusable business logic
|   |   |-- utils/           # Small shared helpers
|   |   |-- app.ts           # Express app and middleware registration
|   |   `-- server.ts        # Database connection and server startup
|   |-- prisma/
|   |   |-- migrations/      # Versioned PostgreSQL schema migrations
|   |   `-- schema.prisma    # Tables, enums, and relations
|   |-- tests/               # API tests
|   |-- .env.example         # Environment variable template
|   |-- tsconfig.json
|   `-- package.json
|-- frontend/
|   |-- public/
|   `-- src/
|       |-- components/      # Shared UI components
|       |-- hooks/           # Reusable React hooks and providers
|       |-- layouts/         # Page layouts
|       |-- pages/           # Route-level screens
|       |-- services/        # API clients
|       |-- types/           # Shared TypeScript types
|       `-- App.tsx          # Frontend routes
|-- .gitignore
```

Keep HTTP concerns in controllers and route definitions, database structure in the Prisma
schema, and reusable business operations in services. Avoid adding layers unless a feature
needs them.

## Prerequisites

- Node.js 20.19+ and npm
- PostgreSQL 14+ locally or a hosted PostgreSQL provider

## Local Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set the backend values in `backend/.env`, then seed the demo account and sample records:

```bash
npm run db:generate
npm run db:migrate:dev -- --name init
npm run seed
npm run dev
```

The API runs at `http://localhost:5000` by default. This migration starts with a fresh
PostgreSQL database; it does not copy existing MongoDB records.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The frontend API base URL defaults to `http://localhost:5000/api`.

### Environment Variables

Backend values are documented in [`backend/.env.example`](backend/.env.example):

| Variable | Purpose | Example |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | Backend listen port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string for the application database | `postgresql://user:password@localhost:5432/hireflow?schema=public` |
| `TEST_DATABASE_URL` | Separate test database URL; database name must end with `_test` | `postgresql://user:password@localhost:5432/hireflow_test?schema=public` |
| `BENCHMARK_DATABASE_URL` | Separate benchmark database URL; database name must end with `_benchmark` | `postgresql://user:password@localhost:5432/hireflow_benchmark?schema=public` |
| `JWT_SECRET` | Secret used to sign access tokens | Set a unique, random value |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

Frontend values are documented in [`frontend/.env.example`](frontend/.env.example):

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL, including `/api` | `http://localhost:5000/api` |

### Backend scripts

From `backend/`, use `npm run dev` during development, `npm run build` to compile
TypeScript into `dist/`, and `npm start` to run the compiled application with Node.js.
Use `npm run db:migrate:deploy` to apply checked-in migrations in production. The test and
benchmark commands require their own isolated PostgreSQL databases; they do not use the
application database. Apply the same migration to each isolated database by temporarily
setting `DATABASE_URL` to that database's URL before running `npm run db:migrate:deploy`.

## API Endpoints

Protected endpoints require `Authorization: Bearer <token>`. Registration and login are rate limited to 20 requests per 15 minutes.

| Area | Method | Endpoint | Description |
| --- | --- | --- | --- |
| Auth | `POST` | `/api/auth/register` | Register a recruiter |
| Auth | `POST` | `/api/auth/login` | Log in and receive a JWT |
| Auth | `GET` | `/api/auth/me` | Get the authenticated user |
| Jobs | `GET` | `/api/jobs` | List, search, and filter jobs |
| Jobs | `GET` | `/api/jobs/:id` | Get a job |
| Jobs | `POST` | `/api/jobs` | Create a job |
| Jobs | `PATCH` | `/api/jobs/:id` | Update a job |
| Jobs | `DELETE` | `/api/jobs/:id` | Delete a job |
| Candidates | `GET` | `/api/candidates` | List, search, and filter candidates |
| Candidates | `GET` | `/api/candidates/:id` | Get a candidate |
| Candidates | `POST` | `/api/candidates` | Create a candidate |
| Candidates | `PATCH` | `/api/candidates/:id` | Update a candidate |
| Candidates | `PATCH` | `/api/candidates/:id/stage` | Move a candidate to a hiring stage |
| Candidates | `DELETE` | `/api/candidates/:id` | Delete a candidate |
| Dashboard | `GET` | `/api/dashboard/stats` | Get dashboard counts and chart data |
| Health | `GET` | `/api/health` | Check API availability |

## Demo Login

Run `npm run seed` from `backend/` to create the demo account and sample data.

- Email: `demo@hireflow.com`
- Password: `demo1234`

## Performance
Run `npm run benchmark` from `backend/` to measure list, cursor, and search queries against
your dedicated benchmark database.

## Deployment

### Backend

Deploy the `backend/` directory to a Node.js host such as Render or Railway. Use `npm install` for installation, `npm run build` for the build command, and `npm start` to launch `dist/server.js`. Configure `DATABASE_URL`, a strong `JWT_SECRET`, and `CLIENT_URL` with the deployed frontend origin. Set `NODE_ENV=production`; use the port supplied by the host.

### Frontend

Deploy `frontend/` to Vercel with `npm run build` as the build command and `dist` as the output directory. Set `VITE_API_BASE_URL` to the deployed backend URL with `/api` appended, and set the backend's `CLIENT_URL` to the Vercel origin. The included `frontend/vercel.json` rewrites application routes to `index.html` for React Router.

## Future Improvements

- Add candidate resume uploads and richer search
- Add pipeline activity history and interview scheduling
- Add export options to reports
- Expand automated API and frontend workflow coverage
