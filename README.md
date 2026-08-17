# CCTV Monitoring Dashboard

Starter implementation for migrating the CCTV dashboard from browser localStorage to Supabase, with GitHub source control and Vercel deployment.

## Setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Create a Supabase project.
4. Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor.
5. Copy `.env.example` to `.env.local` and add your Supabase URL and anon key.
6. Run `npm run dev`.

## GitHub

Create a GitHub repository, then:

```bash
git init
git add .
git commit -m "Initial CCTV dashboard"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Vercel

Import the GitHub repository into Vercel. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as project environment variables, then deploy.

## Important

Do not put a Supabase service-role key in frontend code. Use only the anon/publishable key in Vite frontend environment variables and protect database access with RLS.
