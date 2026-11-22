# Changelog

Notable changes to the live PostgreSQL + Prisma implementation are recorded here.

## Current application

### Authentication and authorization
- JWT authentication for organization users.
- Organization registration with the first user assigned `ADMIN`.
- Password-based registration and login with bcrypt.
- `ADMIN`, `RECRUITER`, and `VIEWER` roles enforced through protected API routes.
- Admin-only team member creation and role-aware frontend navigation.

### Multi-tenancy
- PostgreSQL `Organization`, `User`, `Job`, `Candidate`, `Invoice`, and `InvoiceItem` models.
- Organization-scoped jobs, candidates, dashboards, users, and invoices.
- Cross-organization record access returns not-found responses.
- Candidate job assignments are validated within the same organization.

### Recruitment features
- Job creation, search, filtering, updates, and deletion.
- Candidate creation, search, filtering, updates, stage changes, and deletion.
- Cursor-based candidate pagination and frontend load-more behavior.
- Drag-and-drop pipeline for supported roles.
- Dashboard totals, stage and job charts, and recent candidate activity.

### Placement invoices
- Moving a candidate to `HIRED` emits an in-process `candidate.hired` event.
- A PDFKit service creates and stores an organization-scoped placement invoice.
- `ADMIN` and `RECRUITER` users can download the invoice for a hired candidate.
- Invoice generation is deduplicated per candidate.

### Security and API hardening
- Helmet, CORS configuration, JSON body limits, request logging, and rate limiting.
- Standardized JSON error responses.
- Invalid IDs and malformed request bodies return explicit client errors.
- API rate limits are applied to job, candidate, and dashboard routes.

### Testing
- Jest and Supertest cover authentication, jobs, candidates, multi-tenancy, and RBAC.
- Run the backend suite with `npm test` from `backend/`.

### Tooling
- Backend: Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt, PDFKit, Jest, and Supertest.
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts, and dnd-kit.
- Database migrations are stored in `backend/prisma/migrations/`.

