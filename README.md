# Uncanny - AI Game Studio

Uncanny is a daily web game where players guess if images are real or AI-generated.

## Environment Variables

Make sure to create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

UNSPLASH_ACCESS_KEY=your_unsplash_access_key
CRON_SECRET=your_cron_secret
```

## Content Pipeline (Unsplash)

The app features a daily cron job that fetches candidates for the "real" category from Unsplash.

The cron job is defined in `vercel.json` and hits the `/api/cron/fetch-unsplash-candidates` endpoint daily.

To trigger the cron job manually during development or for testing, you can make a GET request to the endpoint with the `Authorization` header set to your `CRON_SECRET`:

```bash
curl -H "Authorization: Bearer your_cron_secret" http://localhost:3000/api/cron/fetch-unsplash-candidates
```

This will run 10 searches across categories like "surreal landscape" and "optical illusion" to fetch 50 candidate images, which are automatically scored and stored in the `content_candidates` table.

## Development

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
