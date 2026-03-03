# OurAuto

OurAuto is a dealer-only B2B used car marketplace built as a production-oriented SaaS platform. Public users can browse listings and submit inquiries, while verified dealers and admins access protected workflows.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- JWT (httpOnly cookies)
- Zod validation
- Tesseract.js (OCR)
- Resend (Email)
- Cloudinary

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env.local
```

3. Fill required environment variables in `.env.local`.

4. Generate Prisma client:

```bash
npx prisma generate
```

## Commands

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run production server:

```bash
npm run start
```

Deploy DB migrations in production:

```bash
npm run prisma:migrate:deploy
```

## Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN` (optional placeholder, not wired to SDK yet)

## Production Note

Use secure environment secrets, production PostgreSQL, and HTTPS deployment with secure cookie settings enabled.

## Production Hardening Notes

- Cookie policy uses `httpOnly`, `secure` in production, and `sameSite: strict`.
- Mutating cookie-authenticated APIs validate `Origin`/`Referer` for CSRF protection.
- Rate limiting is Redis-backed (Upstash), with local in-memory fallback for development only.
- Admin settings are persisted in DB (`AdminSetting`) and critical actions are recorded in `AuditLog`.
- Profile/media uploads are validated by MIME+size and uploaded to Cloudinary only.
- Public listing and chat endpoints enforce bounded pagination (`max 50`).

## Scalability Guidance

- Keep Prisma in pooled mode on serverless Postgres (`?pgbouncer=true` where supported).
- Prefer indexed filters (`status`, `isActive`, `createdAt`, `price`, `roomId`) in query patterns.
- Avoid `force-dynamic` unless data is truly per-request dynamic.
- Cache public listing responses at CDN edge where business rules permit.
- Keep search input bounded and sanitized before DB query construction.
