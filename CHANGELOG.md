# Changelog - HireFlow

All notable changes and step-by-step progress are recorded here.

## [Step 1: Frontend Pagination Fix]
- Fixed `frontend/src/pages/Candidates.tsx`: removed `page`, `totalPages`, `setPage` state; replaced Previous/Next pagination controls with "Load more" button that appends results with dedupe by `_id`; added request counter to ignore stale responses; search/job/stage changes now reset cursor and list; create/edit/delete resets and reloads.
- Fixed `frontend/src/pages/Pipeline.tsx`: replaced `firstPage.pagination.totalPages` with cursor-following loop (limit=50) until `hasMore` is false, with hard cap of 1000 candidates and cap notice.
- Added `.gitattributes` (`* text=auto eol=lf`).
- Added `"endOfLine": "lf"` to both `frontend/.prettierrc` and `backend/.prettierrc`.

## [Step 2: Search and Benchmark]
- Candidate search already uses MongoDB `$text` index on name/email/skills with escaped-prefix fallback (no change needed).
- Indexes already present: Candidate `{ orgId: 1, stage: 1, createdAt: -1 }`, `{ orgId: 1, createdAt: -1, _id: -1 }`; Job `{ orgId: 1, status: 1 }`.
- Added `backend/src/scripts/benchmark.ts` and `npm script benchmark` that seeds 10,000 candidates and measures p50/p95 latency for list, second-page, and search.

## [Step 5: Hardening and Cleanup]
- Applied `apiLimiter` (200 req/15min) to `/api/jobs`, `/api/candidates`, `/api/dashboard`.
- Applied `aiRateLimiter` (10 req/min) to `/api/ai` (stricter than general API).
- Auth routes keep `authRateLimiter` (20 req/15min).
- Added JSON body size limit of 1mb via `express.json({ limit: '1mb' })`.
- helmet, CORS origin from `CLIENT_URL` env, and error response shape `{ success: false, message }` already in place.
- `.env.example` files list all variables used; no secrets committed.
- `backend/storage/` added to `.gitignore`.

## [Step 4: Tests]
- Added `backend/tests/pagination.test.ts`: cursor pagination correctness, no duplicates/gaps, limit capped at 50, bad cursor returns 400, empty page past end.
- Added `backend/tests/invoice.test.ts`: invoice generated on HIRED, no duplicate on HIRED->HIRED, request succeeds when listener throws, 404 when no invoice, 401 without token.
- Added `backend/tests/hardening.test.ts`: invalid IDs return 400, malformed bodies return 400, server keeps working after errors, deleted user token returns 401, cross-org dashboard and AI lookups isolated, nonexistent valid ObjectId returns 404.
- Total backend test count: 59+ tests across 8 test files.

## [Step 3: HIRED Event and Placement Invoice]
- Added `backend/src/events/candidateEvents.ts` with Node built-in EventEmitter and `candidate.hired` event.
- Added `backend/src/services/invoiceService.ts`: generates a PDF placement invoice with pdfkit (org name, candidate, job, date, invoice number, fixed placeholder fee), saves to `backend/storage/invoices/<orgId>/<candidateId>.pdf`, logs a mock "notification sent" line.
- `updateStage` emits `candidate.hired` fire-and-forget when stage changes TO HIRED from non-HIRED; listener is not awaited in request path; request succeeds even if listener throws.
- Added `GET /api/candidates/:id/invoice` (org-scoped, ADMIN/RECRUITER only) returning the PDF or 404.
- Registered event listener in `app.ts`; added `backend/storage/` to `.gitignore`.

## [Step 1: Multi-tenancy (Organization Isolation)]
- Added `Organization` model (`name`, timestamps).
- Added indexed, required `orgId` to `User`, `Job`, and `Candidate` models with compound indexes (`{ orgId: 1, stage: 1, createdAt: -1 }`, `{ orgId: 1, createdAt: -1 }`, `{ orgId: 1, status: 1 }`).
- Scoped all queries, mutations, aggregations in Job, Candidate, Dashboard, and AI controllers by `req.user.orgId`, returning 404 for records of other organizations.
- Added candidate job verification to ensure candidate's job requisition belongs to the same organization.
- Updated `register` flow to automatically provision an Organization and assign registering user as `ADMIN`.
- Updated JWT generation and `protect` middleware to encode and attach `orgId` and `role`.
- Added admin-only `POST /api/auth/users` endpoint to invite/create users inside the same organization.
- Updated `seed.ts` to provision two isolated organizations (HireFlow Demo Org and Acme Corporation) with isolated jobs and candidates.
- Added comprehensive `multitenancy.test.ts` test suite.

## [Step 2: Role-based Access Control (RBAC)]
- Introduced `UserRole` enum (`ADMIN`, `RECRUITER`, `VIEWER`).
- Created `requireRole` middleware enforcing permissions: ADMIN (all permissions + user management), RECRUITER (jobs, candidates, AI matcher), VIEWER (read-only GET endpoints).
- Applied `requireRole` across job, candidate, dashboard, and AI routes.
- Enforced password minimum length of 8 characters in models, auth controllers, and frontend registration validation.
- Extended `useAuth` hook and `ProtectedRoute` with role support (`isAdmin`, `isRecruiter`, `isViewer`, `roles` prop).
- Updated UI across Jobs, Candidates, Pipeline, and AI Matcher to hide or disable write and drag-and-drop actions for VIEWER accounts.
- Added comprehensive `rbac.test.ts` test suite.

