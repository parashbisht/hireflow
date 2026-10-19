# Implementation Plan - HireFlow Production Readiness

## Baseline
Verification commands could NOT be run in this environment (Node.js/npm not installed on Windows or WSL). All changes below are implemented by careful reading of the existing code and must be verified once Node.js is available.
- `backend` package: build script `tsc`, test script `jest`, lint `eslint . --ext .ts`
- `frontend` package: build `tsc -b && vite build`, lint `eslint .`
- Backend GET /candidates already returns `{ success, data, nextCursor, hasMore }` (no `pagination` object).
- Frontend `Candidates.tsx` still uses `page`, `totalPages`, `setPage` (undefined, build fails).
- Frontend `Pipeline.tsx` reads `firstPage.pagination.totalPages` (throws).
- Multi-tenancy (orgId on User/Job/Candidate), roles ADMIN/RECRUITER/VIEWER with requireRole, admin-created org users, viewer read-only UI, seed data for two orgs are DONE.

## Completion Status

### Step 1: Frontend Pagination - DONE
- `frontend/src/pages/Candidates.tsx`: removed `page`, `totalPages`, `setPage`; added "Load more" with dedupe by `_id`, request counter for stale responses, reset on filter change, reload after create/edit/delete.
- `frontend/src/pages/Pipeline.tsx`: replaced `pagination.totalPages` with cursor-following loop (limit=50), hard cap 1000 with cap notice.
- `frontend/src/services/candidateService.ts`: `cursor?: string | null` type fix.
- Added `.gitattributes` (`* text=auto eol=lf`), `"endOfLine": "lf"` in both `.prettierrc` files.
- Grep verified: no remaining `totalPages`/`setPage`/`pagination`/`firstPage` in frontend pages.

### Step 2: Search and Benchmark - DONE
- Search already uses MongoDB `$text` index with escaped-prefix fallback (no change needed).
- Indexes already present on Candidate and Job models.
- Added `backend/src/scripts/benchmark.ts` and `npm script benchmark`.
- Benchmark output placeholder at `docs/benchmark.txt` (needs Node.js to run).

### Step 3: HIRED Event and Placement Invoice - DONE
- `backend/src/events/candidateEvents.ts`: Node built-in EventEmitter.
- `backend/src/services/invoiceService.ts`: pdfkit PDF generation, local storage, mock notification log.
- `updateStage` emits `candidate.hired` fire-and-forget; listener not awaited; request succeeds if listener throws.
- Added `GET /api/candidates/:id/invoice` (ADMIN/RECRUITER, org-scoped, 404 if missing).
- Listener registered in `app.ts`; `backend/storage/` in `.gitignore`.

### Step 4: Tests - DONE (59+ tests across 8 files)
- `backend/tests/pagination.test.ts`: cursor correctness, no dups/gaps, limit cap 50, bad cursor 400.
- `backend/tests/invoice.test.ts`: invoice on HIRED, no duplicate on HIRED→HIRED, listener throw doesn't break request, 404/401.
- `backend/tests/hardening.test.ts`: invalid IDs 400, malformed bodies 400, server keeps working, deleted user token 401, cross-org dashboard/AI 404.
- Existing: auth(5), candidate(4), job(4), multitenancy(11), rbac(13) = 37 + new 22 = 59+

### Step 5: Hardening and Cleanup - DONE
- `apiLimiter` applied to `/api/jobs`, `/api/candidates`, `/api/dashboard`.
- `aiRateLimiter` applied to `/api/ai`.
- `authRateLimiter` on auth routes (existing).
- `express.json({ limit: '1mb' })` body size limit.
- helmet, CORS from env, consistent error shape already in place.
- `.env.example` files list all variables; no secrets committed.
- No dead code or noisy console.log beyond legitimate startup/error logging.

### Step 6: README - DONE
- Rewritten with features, tech stack, Mermaid diagram, multi-tenancy/RBAC table, setup, tests, benchmark, demo accounts, manual checklist, known limitations, future work.
- `docs/screenshots/README.md` with screenshot list.
- `docs/benchmark.txt` placeholder.

## Files Changed Per Step
Step 1: frontend/src/pages/Candidates.tsx, frontend/src/pages/Pipeline.tsx, frontend/src/services/candidateService.ts, .gitattributes, frontend/.prettierrc, backend/.prettierrc
Step 2: backend/src/scripts/benchmark.ts, backend/package.json (benchmark script)
Step 3: backend/src/events/candidateEvents.ts, backend/src/services/invoiceService.ts, backend/src/controllers/candidateController.ts, backend/src/routes/candidateRoutes.ts, backend/src/app.ts, .gitignore
Step 4: backend/tests/pagination.test.ts, backend/tests/invoice.test.ts, backend/tests/hardening.test.ts
Step 5: backend/src/app.ts (rate limiters, body limit), backend/package.json (pdfkit, @types/pdfkit)
Step 6: README.md, docs/screenshots/README.md, docs/benchmark.txt

## Verification Commands
`cd backend && npm run build && npm test`; `cd frontend && npm run build && npm run lint`; `git diff --check`
(NOT YET RUN — Node.js unavailable in this environment)

## Ambiguity & Design Decisions
1. Registration & Multi-tenancy: On registration, an Organization is created automatically and the registering user becomes `ADMIN`.
2. Org Member Provisioning: Admin can invite/create users inside their own organization via `POST /api/auth/users` (ADMIN only).
3. Cursor Pagination: Base64url-encoded `{ createdAt, id }` tuple cursor, sorted descending. Default limit 10, max 50.
4. Invoice Storage: Saved to `backend/storage/invoices/<orgId>/<candidateId>.pdf`. Downloadable via `GET /api/candidates/:id/invoice`.
5. Error Shapes: Standardized to `{ success: false, message: string }`.
6. Search: already uses `$text` index with escaped-prefix fallback.
7. HIRED event: Node built-in EventEmitter, listener fire-and-forget; request succeeds even if listener throws.
8. Frontend: no Vitest; manual click-through checklist in README instead.
9. Benchmark: measures via Mongoose directly; p50/p95 in ms.

