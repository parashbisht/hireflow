# HireFlow

HireFlow is a full-stack recruitment management application for organizing job openings, tracking candidates, and reviewing hiring activity. Recruiters can move candidates through a six-stage pipeline and see current activity in a dashboard.

## Features

- JWT authentication with recruiter accounts and protected API routes
- Create, search, filter, update, and delete job openings
- Candidate records linked to jobs, with skills, experience, resume text, notes, and hiring stage
- Drag-and-drop hiring pipeline with optimistic stage updates
- Dashboard with job and candidate totals, stage and job charts, and recent candidates
- Resume-match API integration, configured with an optional AI provider key
- Responsive navigation and layouts for desktop and mobile
- Demo data seeding for a recruiter, six jobs, and fifteen candidates

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, dnd-kit
- Backend: Node.js, Express, TypeScript, express-rate-limit
- Database: MongoDB with Mongoose
- Authentication: JWT and bcrypt

## Folder Structure

```text
hireflow/
|-- backend/
|   |-- src/
|   |   |-- config/          # Database and environment configuration
|   |   |-- controllers/     # API request handlers
|   |   |-- middleware/      # Authentication, rate limiting, and errors
|   |   |-- models/          # Mongoose models
|   |   |-- routes/          # Express API routes
|   |   |-- services/        # AI integration services
|   |   |-- seed.ts          # Demo account and sample data seeder
|   |   `-- server.ts        # API server entry point
|   `-- tests/               # API tests
|-- frontend/
|   |-- public/
|   `-- src/
|       |-- components/      # Shared UI components
|       |-- layouts/         # Application layout
|       |-- pages/           # Dashboard and application pages
|       |-- services/        # API clients
|       `-- types/           # TypeScript interfaces
`-- docs/
	`-- screenshots/         # Portfolio screenshots
```

## Prerequisites

- Node.js 20.19+ and npm
- MongoDB locally or a MongoDB Atlas database
- An AI provider API key only if using the resume-match endpoint

## Local Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set the backend values in `backend/.env`, then seed the demo account and sample records:

```bash
npm run seed
npm run dev
```

The API runs at `http://localhost:5000` by default.

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
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/hireflow` |
| `JWT_SECRET` | Secret used to sign access tokens | Set a unique, random value |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `AI_API_KEY` | Optional AI provider key | Leave blank to disable AI requests |
| `AI_API_BASE_URL` | Optional AI-compatible API base URL | `https://api.openai.com/v1` |

Frontend values are documented in [`frontend/.env.example`](frontend/.env.example):

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL, including `/api` | `http://localhost:5000/api` |

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
| AI | `POST` | `/api/ai/resume-match` | Compare resume text with a job description |

## Demo Login

Run `npm run seed` from `backend/` to create the demo account and sample data.

- Email: `demo@hireflow.com`
- Password: `demo123`

## Screenshots

Add screenshots under `docs/screenshots/` and replace these placeholders with captures from the running app.

![Dashboard screenshot](docs/screenshots/dashboard.png)

![Jobs and candidate management screenshot](docs/screenshots/jobs-and-candidates.png)

![Hiring pipeline screenshot](docs/screenshots/pipeline.png)

## Deployment

### Backend

Deploy the `backend/` directory to a Node.js host such as Render or Railway. Use `npm install` for installation, `npm run build` for the build command, and `npm start` to launch `dist/server.js`. Configure `MONGO_URI`, a strong `JWT_SECRET`, `CLIENT_URL` with the deployed frontend origin, and any AI provider values. Set `NODE_ENV=production`; use the port supplied by the host.

### Frontend

Deploy `frontend/` to Vercel with `npm run build` as the build command and `dist` as the output directory. Set `VITE_API_BASE_URL` to the deployed backend URL with `/api` appended, and set the backend's `CLIENT_URL` to the Vercel origin. The included `frontend/vercel.json` rewrites application routes to `index.html` for React Router.

## Future Improvements

- Add role-based team permissions and organization workspaces
- Add candidate resume uploads and richer search
- Add pipeline activity history and interview scheduling
- Add pagination controls and export options to reports
- Expand automated API and frontend workflow coverage
