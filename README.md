# JobberMed

JobberMed is a healthcare jobs platform with two job surfaces:

- Aggregated listings ingested from three external jobsites (anonymised here as `Jobsite 1`, `Jobsite 2`, `Jobsite 3`).
- Native listings posted directly by recruiters inside JobberMed.

The repo includes scraping + extraction pipelines, a React web app, Supabase-backed auth/roles, and email delivery workflows (weekly and personalised digests).

## Current Product Scope

- React + Vite web app in `web/` (active product UI).
- Supabase auth with role-aware dashboards:
  - `candidate`
  - `recruiter`
  - `mdcn_official`
  - `admin`
- Recruiter role request flow:
  - Single CTA from `/dashboard` to `/request-access/recruiter`.
  - Admin approves from `/admin`.
  - User refreshes access after approval.
- MDCN role is admin-assigned only (no self-service request UI).
- Password management:
  - Sign-in includes `Forgot password?`.
  - Public reset flow via `/forgot-password` and `/reset-password`.
  - Authenticated change flow via `/account/change-password`.
- Personalisation controls moved to `/account/personalization` with multi-select location filters.

## Repository Structure

```text
.
├── config.py
├── main.py
├── extract.py
├── run_pipeline.py
├── newsletter.py
├── scripts/
│   ├── check_master_jobs_bridge.sh
│   ├── sync_master_jobs_bridge.sh
│   ├── sync_delivery_segments.py
│   ├── personalized_digest.py
│   └── email_runtime.py
├── data/
│   └── master_jobs.json
├── json/
│   └── raw_jobs.json
├── scrapers/
├── supabase/
│   ├── migrations/
│   └── README.md
├── web/
│   ├── public/data/master_jobs.json
│   └── src/
└── legacy/docs/  (archival only)
```

## Data Files and Bridge

- Canonical aggregated jobs output: `data/master_jobs.json`
- Frontend-served bridge copy: `web/public/data/master_jobs.json`

Sync bridge manually:

```bash
./scripts/sync_master_jobs_bridge.sh
```

Validate bridge consistency:

```bash
./scripts/check_master_jobs_bridge.sh
```

## Web Routes (Current)

Public:

- `/`
- `/native-jobs`
- `/native-jobs/:jobId`
- `/signin`
- `/signup`
- `/forgot-password`
- `/reset-password`

RequireAuth:

- `/dashboard`
- `/request-access/recruiter`
- `/account/personalization`
- `/account/change-password`

RequireRole:

- `/recruiter`
- `/recruiter/jobs/new`
- `/recruiter/jobs/:jobId/applicants`
- `/mdcn`
- `/admin`

Fallback behaviour:

- Missing recruiter role: redirect to `/request-access/recruiter`
- Missing MDCN role: informational screen only (`MDCN access required`, contact admin)
- Missing admin role: access denied fallback

## Role and Access Model

- Base role resolves as candidate.
- Authoritative role IDs used by UI/guards:
  - `recruiter`
  - `mdcn_official`
  - `admin`
- Guards:
  - `RequireAuth` validates active session.
  - `RequireRole` validates required role and supports admin bypass where configured.
- Admin approvals run via Supabase RPC `approve_access_request()`.

## Account and Security UX

Sign-in and recovery:

- `/signin` supports `next` redirect.
- Forgot password sends reset email with redirect target `${origin}/reset-password`.
- Reset page waits for auth hydration before declaring invalid/expired link.

Change password:

- Available from dashboard account card and `/account/change-password`.
- Supports optional current-password verification before `updateUser({ password })`.

## Personalisation UX

Personalisation summary is shown on `/dashboard`.
Full controls are on `/account/personalization`.

Supported location options:

- `All states`
- `FCT`
- All 36 Nigerian states
- `Remote`
- `Outside Nigeria`

Selection rules:

- Selecting `All states` clears specific state picks.
- Selecting any specific state clears `All states`.
- `Remote` and `Outside Nigeria` can coexist with state filters.

## Native Jobs UX

Candidate flow:

- Browse published native jobs.
- Open detail page and submit application.
- Track submitted applications from dashboard.

Recruiter flow:

- Create native jobs.
- View jobs and open applicant lists.

Reviewer/admin flow:

- MDCN dashboard reviews native applications and updates status.

Application form:

- CV field requests a shareable drive URL.
- Cover letter minimum length is enforced client-side.

## Data Pipeline

End-to-end pipeline:

1. Scrape raw jobs from 3 sources.
2. Run extraction/normalisation with OpenAI.
3. Write canonical output to `data/master_jobs.json`.
4. Sync bridge copy to `web/public/data/master_jobs.json`.

Run all-in-one:

```bash
python run_pipeline.py
./scripts/sync_master_jobs_bridge.sh
```

Run step-by-step:

```bash
python main.py
python extract.py
./scripts/sync_master_jobs_bridge.sh
```

Notes:

- Source adapters are intentionally anonymised in this README as `Jobsite 1/2/3`.
- Scraper enablement, pacing, and limits are controlled in `config.py`.

## Email Delivery Workflows

Weekly digest:

- Script: `newsletter.py`
- Sends to weekly list in Brevo.

Segment sync:

- Script: `scripts/sync_delivery_segments.py`
- Removes opted-in personalised users from weekly list and optionally adds them to personalised list.

Personalised digest:

- Script: `scripts/personalized_digest.py`
- Reads preference tables and sends filtered jobs.
- Supports dedupe via `email_delivery_log.dedupe_key`.

Manual runs:

```bash
python scripts/sync_delivery_segments.py
python scripts/personalized_digest.py
python newsletter.py
```

Dry-run flags:

- `NEWSLETTER_DRY_RUN=true`
- `SYNC_DRY_RUN=true`
- `PERSONALIZED_DRY_RUN=true`

## Environment Variables

Root `.env` (`.env.example`):

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `BREVO_LIST_ID`
- `BREVO_WEEKLY_LIST_ID`
- `BREVO_PERSONALIZED_LIST_ID`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `EMAIL_CTA_URL`
- `SITE_BASE_URL`
- `NEWSLETTER_DRY_RUN`
- `SYNC_DRY_RUN`
- `PERSONALIZED_DRY_RUN`
- `PERSONALIZED_DIGEST_JOB_LIMIT`
- Optional override: `MASTER_JOBS_PATH`

Web `.env` (`web/.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Local Setup

### 1) Python pipeline setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Web setup

```bash
npm --prefix web install
```

### 3) Run web app

```bash
npm --prefix web run dev
```

### 4) Build web app

```bash
npm --prefix web run build
```

## Supabase Schema

Database migrations live in `supabase/migrations/`.
Schema and RLS documentation lives in `supabase/README.md`.

Core app tables used by current flows include:

- `profiles`
- `native_jobs`
- `native_job_applications`
- `user_platform_roles`
- `access_requests`
- `email_preferences`
- `email_pref_categories`
- `email_pref_locations`
- `email_delivery_log`

Useful checks:

```bash
supabase db lint
supabase db reset
```

## CI / Scheduled Automation

GitHub Actions workflows:

- `.github/workflows/daily_scrape.yml`
  - Runs scraping + extraction daily
  - Syncs bridge and commits updated data artifacts
- `.github/workflows/weekly_scrape.yml`
  - Syncs delivery segments then sends weekly digest
- `.github/workflows/personalized_email.yml`
  - Runs segment sync and personalised digest daily

## Troubleshooting

`Supabase environment variables are missing`

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `web/.env`.

`Invalid or expired link` on reset page

- Request a new link via `/forgot-password`.
- Confirm Supabase Auth redirect allowlist includes `<origin>/reset-password`.

Recruiter approval completed but route still blocked

- Use `Refresh access` on the recruiter request page.
- If still blocked, sign out and sign in again.

Bridge drift warning

- Run `./scripts/sync_master_jobs_bridge.sh`, then re-check with `./scripts/check_master_jobs_bridge.sh`.

## Legacy Notes

- `legacy/docs/` remains for archival reference and is not the active production UI.
- Active deploy artifact is `web/dist`.
