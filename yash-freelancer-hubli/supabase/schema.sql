create table if not exists public.leads (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null,
  service text not null,
  budget text,
  message text not null,
  status text not null default 'New' check (status in ('New', 'Contacted', 'In progress', 'Closed')),
  date text not null default to_char(now() at time zone 'Asia/Kolkata', 'DD/MM/YYYY'),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  name text not null default '',
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key default gen_random_uuid()::text,
  client_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'New',
  progress integer not null default 0 check (progress between 0 and 100),
  updated text not null default to_char(now() at time zone 'Asia/Kolkata', 'DD/MM/YYYY'),
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_clicks (
  id uuid primary key default gen_random_uuid(),
  source text not null check (length(trim(source)) between 1 and 80),
  page text not null check (length(page) <= 300),
  created_at timestamptz not null default now()
);

alter table public.leads alter column id set default gen_random_uuid()::text;
alter table public.projects add column if not exists client_id uuid references auth.users(id) on delete cascade;
alter table public.projects alter column id set default gen_random_uuid()::text;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id::text, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do update
    set name = excluded.name, email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.leads enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.whatsapp_clicks enable row level security;

drop policy if exists "Allow public read for leads" on public.leads;
drop policy if exists "Allow public insert for leads" on public.leads;
drop policy if exists "Allow public update for leads" on public.leads;
drop policy if exists "Public can submit enquiries" on public.leads;
drop policy if exists "Admins can read leads" on public.leads;
drop policy if exists "Admins can update leads" on public.leads;
drop policy if exists "Admins can delete leads" on public.leads;
create policy "Public can submit enquiries" on public.leads
  for insert to anon, authenticated
  with check (status = 'New' and length(trim(name)) > 0 and length(trim(email)) > 3 and length(trim(message)) > 0);
create policy "Admins can read leads" on public.leads
  for select to authenticated using (public.is_admin());
create policy "Admins can update leads" on public.leads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete leads" on public.leads
  for delete to authenticated using (public.is_admin());

drop policy if exists "Allow public read for profiles" on public.profiles;
drop policy if exists "Allow public insert for profiles" on public.profiles;
drop policy if exists "Allow public update for profiles" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admins can read profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid()::text);
create policy "Admins can read profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()::text)
  with check (id = auth.uid()::text);

drop policy if exists "Admins can check own membership" on public.admin_users;
create policy "Admins can check own membership" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Allow public read for projects" on public.projects;
drop policy if exists "Allow public insert for projects" on public.projects;
drop policy if exists "Allow public update for projects" on public.projects;
drop policy if exists "Clients can read own projects" on public.projects;
drop policy if exists "Admins can manage projects" on public.projects;
create policy "Clients can read own projects" on public.projects
  for select to authenticated using (client_id = auth.uid());
create policy "Admins can manage projects" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can log WhatsApp clicks" on public.whatsapp_clicks;
drop policy if exists "Admins can read WhatsApp clicks" on public.whatsapp_clicks;
create policy "Public can log WhatsApp clicks" on public.whatsapp_clicks
  for insert to anon, authenticated
  with check (length(trim(source)) > 0 and length(page) <= 300);
create policy "Admins can read WhatsApp clicks" on public.whatsapp_clicks
  for select to authenticated using (public.is_admin());

grant usage on schema public to anon, authenticated;
revoke insert on public.leads from anon, authenticated;
grant insert (name, email, service, budget, message) on public.leads to anon, authenticated;
grant select, update, delete on public.leads to authenticated;
grant select on public.profiles to authenticated;
grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant insert (source, page) on public.whatsapp_clicks to anon, authenticated;
grant select on public.whatsapp_clicks to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
