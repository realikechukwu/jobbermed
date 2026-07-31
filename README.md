# JobberMed

JobberMed is a healthcare jobs platform with two connected job surfaces:

- Aggregated jobs scraped from 5 external jobsites
- Native jobs posted directly inside JobberMed by approved recruiters

This repository contains the full operating stack for that product:

- Python scraping and extraction pipeline for aggregated jobs
- React + Vite frontend in `web/`
- Supabase-backed auth, roles, native jobs, access requests, and email preferences
- Email delivery workflows for weekly and personalized job digests

## Not Open Source

This project is not open source. All rights are reserved. No permission is granted to use, copy, modify, deploy, or redistribute this code or the job data it contains. See [`LICENSE`](LICENSE).

Issues and pull requests are not accepted.

## What This Repo Does

At a high level, the repo does four things:

1. Collects healthcare job listings from external jobsites
2. Normalizes those listings into one canonical aggregated dataset
3. Runs the JobberMed web app for public browsing, dashboards, and native job applications
4. Sends weekly and personalized job emails

## End-to-End Workflow

### 1. Aggregated job ingestion

`main.py` runs 5 source-specific scrapers:

- `medlocum`
- `jobsinnigeria`
- `medicalworldnigeria`
- `hotnigerianjobs`
- `myjobmag`

Raw scraper output is written to:

- `json/raw_jobs.json`
- `json/latest_raw_jobs.json`

### 2. Extraction and normalization

`extract.py` uses OpenAI to turn raw scraped content into a consistent jobs dataset with fields such as:

- title
- company
- location
- category
- salary
- deadline
- apply instructions

Canonical aggregated output is written to:

- `data/master_jobs.json`

Extraction cache is written to:

- `data/extraction_cache.json`

### 3. Frontend bridge

The web app serves aggregated jobs from a static bridge file:

- source of truth: `data/master_jobs.json`
- frontend-served copy: `web/public/data/master_jobs.json`

Bridge scripts:

```bash
./scripts/sync_master_jobs_bridge.sh
./scripts/check_master_jobs_bridge.sh
```

### 4. Web product

The React app exposes:

- Unified job board on `/` with a source toggle: All jobs, Direct Apply (posted on JobberMed), and External (aggregated)
- Direct Apply view via `/?source=direct` (legacy `/native-jobs` and `/jobs/direct` redirect here)
- Direct Apply application flow on `/jobs/direct/:jobId` (legacy `/native-jobs/:jobId` redirects here)
- Auth flows for sign-up, sign-in, password reset, and password change
- Role-aware dashboards for candidates, recruiters, MDCN reviewers, and admins
- Email personalization controls for signed-in users

Board filter state (source, category, location, keyword, saved-only, page) lives in the URL query string, so filtered views are shareable and survive reloads.

### 5. Direct Apply (native) jobs and role workflows

Direct Apply jobs (internally "native jobs") live in Supabase and support these flows:

- Signed-in candidates browse published Direct Apply jobs and submit applications
- Recruiters request access, then create jobs and review applicants
- MDCN reviewers review native applications and update statuses
- Admins approve recruiter access requests and manage elevated role access

### 6. Email delivery

The repo also runs email automation:

- `newsletter.py` sends the weekly digest
- `scripts/sync_delivery_segments.py` keeps weekly and personalized lists aligned
- `scripts/personalized_digest.py` sends personalized digests using saved preferences

## Product Surfaces

### Public

- Unified job board homepage (aggregated + Direct Apply, with source toggle)
- Direct Apply job detail and application pages
- About, privacy, subscribe, and "Why JobberMed" (`/landing`) pages
- Sign-in, sign-up, forgot-password, and reset-password flows
- Not-found page for unknown routes

### Signed-in account

- `/dashboard` shows:
  - active roles
  - available workspaces
  - native application history
  - current email personalization summary

### Recruiter workspace

- Request recruiter access from `/request-access/recruiter`
- Open `/recruiter` after approval
- Create native jobs at `/recruiter/jobs/new`
- Review applicants at `/recruiter/jobs/:jobId/applicants`

### MDCN workspace

- `/mdcn` provides the native application review queue
- MDCN access is currently admin-assigned

### Admin workspace

- `/admin` reviews pending access requests and activates platform roles

## Roles and Access Model

- Every authenticated user resolves to at least `candidate`
- Additional platform roles are:
  - `recruiter`
  - `mdcn_official`
  - `admin`
- The UI resolves roles from both auth claims and `user_platform_roles`
- Admin approvals run through the Supabase RPC `approve_access_request()`
- Recruiter access has a user-facing request flow; MDCN access is admin-assigned

Current fallback behavior:

- Missing recruiter role redirects to `/request-access/recruiter`
- Missing MDCN role shows an informational access-required screen
- Missing admin role shows an access-denied screen

## Repository Structure

```text
.
├── config.py
├── main.py
├── extract.py
├── run_pipeline.py
├── newsletter.py
├── data/
│   ├── master_jobs.json
│   └── extraction_cache.json
├── json/
│   ├── raw_jobs.json
│   └── latest_raw_jobs.json
├── scrapers/
├── scripts/
│   ├── sync_master_jobs_bridge.sh
│   ├── check_master_jobs_bridge.sh
│   ├── sync_delivery_segments.py
│   ├── personalized_digest.py
│   └── email_runtime.py
├── supabase/
│   ├── migrations/
│   └── README.md
├── web/
│   ├── public/data/master_jobs.json
│   └── src/
└── legacy/  (archival only)
```

## Common Commands

### Run the aggregated jobs pipeline

All in one:

```bash
python run_pipeline.py
./scripts/sync_master_jobs_bridge.sh
```

Step by step:

```bash
python main.py
python extract.py
./scripts/sync_master_jobs_bridge.sh
```

### Run the web app

```bash
npm --prefix web install
npm --prefix web run dev
```

Build production assets:

```bash
npm --prefix web run build
```

Useful frontend checks:

```bash
npm --prefix web run lint
npm --prefix web run typecheck
```

### Run email workflows manually

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

Root `.env` (`.env.example`)

Pipeline:

- `OPENAI_API_KEY`
- `MASTER_JOBS_PATH` (optional override)

Supabase runtime:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Brevo and email delivery:

- `BREVO_API_KEY`
- `BREVO_LIST_ID`
- `BREVO_WEEKLY_LIST_ID`
- `BREVO_PERSONALIZED_LIST_ID`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `EMAIL_CTA_URL`
- `SITE_BASE_URL`

Email execution flags:

- `NEWSLETTER_DRY_RUN`
- `SYNC_DRY_RUN`
- `PERSONALIZED_DRY_RUN`
- `PERSONALIZED_DIGEST_JOB_LIMIT`

Web `.env` (`web/.env.example`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Local Setup

### 1. Python pipeline setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Web setup

```bash
npm --prefix web install
```

### 3. Start the app

```bash
npm --prefix web run dev
```

## Supabase

Database migrations live in `supabase/migrations/`.

Schema and RLS notes live in:

- `supabase/README.md`

Core tables used by the current product include:

- `profiles`
- `native_jobs`
- `native_job_applications`
- `user_platform_roles`
- `access_requests`
- `email_preferences`
- `email_pref_categories`
- `email_pref_locations`
- `email_delivery_log`

Useful validation commands:

```bash
supabase db lint
supabase db reset
```

## Automation

GitHub Actions workflows currently automate:

- `.github/workflows/daily_scrape.yml`
  - scrape external jobs
  - run extraction
  - sync `web/public/data/master_jobs.json`
  - commit updated data artifacts
- `.github/workflows/weekly_scrape.yml`
  - sync weekly list exclusions
  - send weekly digest
- `.github/workflows/personalized_email.yml`
  - sync delivery segments
  - send personalized digests
- `.github/workflows/deploy-web-pages.yml`
  - build the Vite app
  - deploy `web/dist` to GitHub Pages

## Troubleshooting

`Supabase environment variables are missing`

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `web/.env`

`Invalid or expired link` on reset page

- Request a new link via `/forgot-password`
- Confirm Supabase Auth redirect allowlist includes `<origin>/reset-password`

Recruiter approval completed but route still blocked

- Use `Refresh access` on the recruiter request page
- If access still does not update, sign out and sign back in

Bridge drift warning

- Run `./scripts/sync_master_jobs_bridge.sh`
- Re-run `./scripts/check_master_jobs_bridge.sh`

## Legacy Notes

- `legacy/` remains for archival reference and is not the active production UI
- The active frontend lives in `web/`
- The production build artifact is `web/dist`
