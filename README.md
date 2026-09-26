# HireFlow

A full-stack Recruitment Management System built with the MERN stack (MongoDB, Express, React, Node.js).

Recruiters can post jobs, manage candidates, move them through a hiring pipeline, and use an AI-powered tool to match resumes against job descriptions.

## Key Features
- 🔐 Secure login & authentication (JWT + bcrypt)
- 💼 Job posting management (create, edit, search, filter)
- 👥 Candidate tracking linked to job applications
- 📊 Visual hiring pipeline (Applied → Interview → Selected)
- 📈 Live dashboard with real-time stats and charts
- 🤖 AI Resume Matcher — scores resumes against job requirements

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|--------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Get the current logged-in user |
| `GET` | `/api/jobs` | List jobs *(search, filter, paginate)* |
| `POST` | `/api/jobs` | Create a job |
| `PATCH` | `/api/jobs/:id` | Update a job |
| `DELETE` | `/api/jobs/:id` | Delete a job |
| `GET` | `/api/candidates` | List candidates *(search, filter, paginate)* |
| `POST` | `/api/candidates` | Create a candidate |
| `PATCH` | `/api/candidates/:id` | Update a candidate |
| `PATCH` | `/api/candidates/:id/status` | Move a candidate through the pipeline |
| `DELETE` | `/api/candidates/:id` | Delete a candidate |
| `GET` | `/api/dashboard/stats` | Live recruitment statistics |
| `POST` | `/api/ai/resume-match` | AI-powered resume-to-job matching |

> All routes except register/login require `Authorization: Bearer <token>`.


## Tech Stack
**Frontend:** React, TypeScript, Tailwind CSS  
**Backend:** Node.js, Express  
**Database:** MongoDB

## Getting Started
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```
Then open `http://localhost:5173`

## File Structure

hireflow/
├── backend/
│ └── src/
│ ├── config/ # DB connection, env config
│ ├── controllers/ # Route handlers
│ ├── middleware/ # Auth, error handling, rate limiting
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API routes
│ └── services/ # AI matcher integration
│
└── frontend/
└── src/
├── components/ # Reusable UI components
├── hooks/ # Auth context
├── layouts/ # Sidebar / main layout
├── pages/ # Route-level pages
├── services/ # API clients
└── types/ # TypeScript interfaces