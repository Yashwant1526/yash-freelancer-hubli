# YPX Studios

React and Vite website with Supabase Auth and database policies for enquiries and client projects.

## Local development

Copy `.env.example` to `.env`, add the Supabase project URL and publishable/anon key, then run:

```bash
npm install
npm run dev
```

## Supabase backend setup

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/schema.sql`.
3. In **Authentication → Providers**, make sure Email sign-in is enabled.
4. Add your deployed site URL to **Authentication → URL Configuration → Redirect URLs**.
5. Create your administrator account from the site's **Client login → Create an account** form and confirm its email if Supabase requests it.
6. In Supabase SQL Editor, grant that account administrator access by replacing the email below with the same account email:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'you@example.com'
on conflict (user_id) do nothing;
```

Sign into **Client login** with that account, then open **Admin**. The database only permits listed administrator accounts to read or manage enquiries. Clients can only read projects assigned to their own account.

## Hosting environment variables

Set these variables in your hosting provider's project settings, then redeploy:

```text
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Use only the Supabase publishable/anon key in the browser app. Never put the `service_role` key in frontend or hosting build variables.

For Render, use root directory `yash-freelancer-hubli`, build command `npm install && npm run build`, and publish directory `dist`.

## Data and access

- Enquiry form submissions are stored in Supabase.
- WhatsApp button clicks are stored in `public.whatsapp_clicks`; inspect this table in Supabase **Table Editor**. It stores the click source and page, not WhatsApp message contents or replies.
- Enquiry reads, status changes, and deletion require administrator membership.
- Client authentication uses Supabase Auth; passwords are not stored by this app.
- Project records are scoped to the assigned Supabase Auth user.
- New projects can be assigned from the admin UI to the signed-in account. Assigning a different client's project requires setting its `client_id` to that client's Auth user ID in Supabase.
- Do not use the old demo account or project data for real customers.
