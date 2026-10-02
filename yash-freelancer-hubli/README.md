# Yash Freelancer Hubli — live-ready React app

A responsive freelance business website built with React, Vite, and Supabase-ready data storage for deployment on Netlify.

## Run locally

1. Install Node.js 20+.
2. Open the project folder in VS Code.
3. Copy `.env.example` to `.env` and fill in your Supabase values.
4. Run:

```bash
npm install
npm run dev
```

5. Open the URL shown by Vite, usually `http://localhost:5173`.

## Deploy to Netlify

1. Push this project to GitHub.
2. Create a new site in Netlify.
3. Set the build command to:

```bash
npm run build
```

4. Set the publish directory to:

```bash
dist
```

5. Add environment variables in Netlify:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WHATSAPP_NUMBER=919876543210
```

6. Deploy the site.

## Supabase setup

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run the contents of `supabase/schema.sql`.
4. Confirm the `public.leads`, `public.projects`, and `public.profiles` tables exist.
5. Make sure the Supabase anon key is added to your Netlify environment variables.

## What this app does

- Accepts leads from the contact form
- Saves leads to Supabase when configured
- Saves projects and user profiles to Supabase when configured
- Falls back to browser localStorage if the app is run without env values
- Uses a Netlify-ready static build

## Before launch

- Replace the WhatsApp number in `src/App.jsx` or environment variables.
- Update the email, address, and business details.
- Add a real Supabase auth flow if you want customer-only project pages.
- Keep your project URL and Supabase keys in Netlify environment settings.
