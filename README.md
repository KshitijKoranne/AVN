# AVN Track

A daily pain and recovery tracker for avascular necrosis (osteonecrosis) patients.

Built by [@kshitijkoranne](https://x.com/kshitijkoranne) — a pharma QA professional living with bilateral AVN, building in public.

## What it does

- **Daily pain log** — location, intensity, triggers, what helped
- **Exercise tracker** — pre-loaded AVN-safe and post-THR exercises
- **Trends** — 30-day pain history, most common triggers, logging streaks
- **Profile** — medical history, affected joints, surgical status, AVN stage

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) (database + auth)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel](https://vercel.com) (deployment)
- Design system generated with [Google Stitch](https://stitch.withgoogle.com)

## Getting started

```bash
# Install dependencies
npm install

# Add environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database

Run `schema.sql` in your Supabase SQL editor to create all tables, policies, and seed exercises.

## Building in public

Follow the journey on X: [@kshitijkoranne](https://x.com/kshitijkoranne)

## License

MIT
