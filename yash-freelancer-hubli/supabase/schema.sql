create table if not exists public.leads (
  id text primary key,
  name text,
  email text,
  service text,
  budget text,
  message text,
  status text default 'New',
  date text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id text primary key,
  name text,
  status text default 'New',
  progress integer default 0,
  updated text,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id text primary key,
  name text,
  email text,
  created_at timestamptz default now()
);

alter table public.leads enable row level security;
alter table public.projects enable row level security;
alter table public.profiles enable row level security;

create policy "Allow public read for leads" on public.leads for select using (true);
create policy "Allow public insert for leads" on public.leads for insert with check (true);
create policy "Allow public update for leads" on public.leads for update using (true) with check (true);

create policy "Allow public read for projects" on public.projects for select using (true);
create policy "Allow public insert for projects" on public.projects for insert with check (true);
create policy "Allow public update for projects" on public.projects for update using (true) with check (true);

create policy "Allow public read for profiles" on public.profiles for select using (true);
create policy "Allow public insert for profiles" on public.profiles for insert with check (true);
create policy "Allow public update for profiles" on public.profiles for update using (true) with check (true);
