# OurAuto - Dealer-Only Marketplace SaaS

Production-grade App Router SaaS for verified automobile dealers.

## Tech Stack

- Next.js App Router + TypeScript strict
- Tailwind CSS
- Supabase (Auth, DB, Storage, RLS)
- Supabase Edge Function (OCR)
- Middleware security

## Run Locally

```bash
npm install
npm run dev
```

Create `.env.local` at project root with the required keys (leave secret values empty until you add your own):

```dotenv
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# OCR Edge Function
OCR_EDGE_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/ocr-plate

# Security
SUSPICIOUS_KEYWORDS=fraud,scam,duplicate,fake,illegal,stolen,blacklisted
```

## Build

```bash
npm run build
```

## Main Features

- OLX-style marketplace with advanced filtering + sorting
- Vertical reel-style cards with swipe feed and double-tap heart
- Dealer profile with stories, badge, ratings, and metrics
- Smart listing parser for WhatsApp-style text
- OCR registration extraction + duplicate protection
- Security controls: reCAPTCHA, rate limits, suspicious keyword filter, duplicate image hash checks
- Dashboard with KPIs, conversion, graph, credits counters
- Extra systems: reels video listing, AI price suggestion, referral wallet, push notifications, sold auto-removal

## Supabase Setup

1. Create a Supabase project.
2. Execute [supabase/schema.sql](supabase/schema.sql) in SQL editor.
3. Get Supabase keys from **Project Settings → API**:
	- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon / publishable key
	- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (server only, never expose to client)
4. Deploy OCR edge function from [supabase/functions/ocr-plate/index.ts](supabase/functions/ocr-plate/index.ts):
	```bash
	supabase login
	supabase link --project-ref <your-project-ref>
	supabase functions deploy ocr-plate
	```
5. Set edge function secrets as needed (for example `GOOGLE_VISION_API_KEY`) and set `OCR_EDGE_FUNCTION_URL` to:
	```text
	https://<your-project-ref>.supabase.co/functions/v1/ocr-plate
	```

## OCR Edge Function - Ops Runbook

**Purpose**
- OCR edge function powers number plate extraction and duplicate listing prevention.

**One-Command Deploy**
```bash
supabase login
supabase link --project-ref <PROJECT_ID>
supabase functions deploy ocr-plate
```

**Post-Deploy Verification**
- Production URL format: `https://PROJECT_ID.supabase.co/functions/v1/ocr-plate`
```bash
curl -i https://PROJECT_ID.supabase.co/functions/v1/ocr-plate
```
- Any non-`404` response confirms the function is deployed and reachable.

**Environment Variable Reminder**
- `OCR_EDGE_FUNCTION_URL` is server-only, must not use `NEXT_PUBLIC_`, and must be set in Vercel Preview and Production.

**Security Notes**
- Never expose `SUPABASE_SERVICE_ROLE_KEY`.
- Do not log raw image payloads.
- Do not commit secrets.

## reCAPTCHA Setup

1. Create reCAPTCHA keys in Google reCAPTCHA Admin Console.
2. Add allowed domains:
	- local: `localhost`
	- preview: your `*.vercel.app` domain
	- production: your custom production domain
3. Use:
	- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` for client widget
	- `RECAPTCHA_SECRET_KEY` for server-side verification only

## Vercel Deployment

1. Push repo to Git provider.
2. Import project in Vercel.
3. Add all required variables for **Preview** and **Production** environments:
	- `NEXT_PUBLIC_APP_URL`
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `SUPABASE_SERVICE_ROLE_KEY`
	- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
	- `RECAPTCHA_SECRET_KEY`
	- `OCR_EDGE_FUNCTION_URL`
	- `SUSPICIOUS_KEYWORDS`
4. Set environment-specific values:
	- Preview: `NEXT_PUBLIC_APP_URL=https://<preview-domain>.vercel.app`
	- Production: `NEXT_PUBLIC_APP_URL=https://<your-production-domain>`
5. Deploy.
6. Run post-deploy smoke tests:
	- signup/login reCAPTCHA
	- OCR duplicate blocking
	- listing creation and sold flow
	- dashboard metrics rendering

## CI Gate (GitHub Actions)

Workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)

Runs on:
- every pull request
- every push to `main`

Mandatory checks:
- `npm run validate:env`
- `npm run typecheck`
- `npm run lint:ci`
- `npm run build`
- `npm run test:smoke:api`

### Required GitHub Secrets

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`
- `OCR_EDGE_FUNCTION_URL`
- `SUSPICIOUS_KEYWORDS`

Add these in GitHub: **Repository → Settings → Secrets and variables → Actions → New repository secret**.
The CI workflow runs `npm run validate:env` and fails immediately when any required key is missing or empty.

### Vercel Integration

1. In Vercel project settings, set the same environment variables for Preview and Production.
2. In Vercel Git settings, enable branch protection by requiring the GitHub `CI Gate` check before merge.
3. Keep Vercel deploys enabled for `main` only after CI passes.

## Preview Runtime Smoke (Vercel)

Workflow: [.github/workflows/preview-smoke.yml](.github/workflows/preview-smoke.yml)

Trigger behavior:
- runs on GitHub `deployment_status`
- executes only when deployment is `success`
- executes only for `preview` environments
- uses preview URL from `deployment_status.environment_url`

Runtime checks on live preview URL:
- homepage returns `200`
- protected endpoint returns `401` when unauthenticated
- listing creation `POST` returns `401` when unauthenticated
- rate-limit returns `429` under repeated requests
- reCAPTCHA endpoint rejects empty token

Vercel GitHub App integration:
1. Install/connect Vercel GitHub app for the repository.
2. Ensure Vercel posts deployment statuses back to GitHub (enabled by default when app is connected).
3. Add branch protection rule to require `Preview Runtime Smoke` before merge if you want preview runtime safety as a hard gate.

## Security Notes

- Middleware applies CSP + security headers and API throttling.
- Supabase RLS enforces dealer-scoped access.
- Duplicate registration is blocked at API and DB levels.
