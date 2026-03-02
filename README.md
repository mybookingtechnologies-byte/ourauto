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

## Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Production Note

Use secure environment secrets, production PostgreSQL, and HTTPS deployment with secure cookie settings enabled.
