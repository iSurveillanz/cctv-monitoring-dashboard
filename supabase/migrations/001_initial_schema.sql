create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  cameras integer not null check (cameras > 0),
  shift text not null,
  vms text not null,
  color text not null default '#3b7cff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.panel_assignments (
  id uuid primary key default gen_random_uuid(),
  panel_code text not null unique,
  unit text not null check (unit in ('Unit 1','Unit 2')),
  operator_name text,
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.panel_assignments enable row level security;

create policy "authenticated users can read clients" on public.clients for select to authenticated using (true);
create policy "authenticated users can insert clients" on public.clients for insert to authenticated with check (true);
create policy "authenticated users can update clients" on public.clients for update to authenticated using (true) with check (true);
create policy "authenticated users can delete clients" on public.clients for delete to authenticated using (true);

create policy "authenticated users can read assignments" on public.panel_assignments for select to authenticated using (true);
create policy "authenticated users can insert assignments" on public.panel_assignments for insert to authenticated with check (true);
create policy "authenticated users can update assignments" on public.panel_assignments for update to authenticated using (true) with check (true);
create policy "authenticated users can delete assignments" on public.panel_assignments for delete to authenticated using (true);

insert into public.panel_assignments(panel_code,unit) values
('A1','Unit 1'),('A2','Unit 1'),('A3','Unit 1'),('A4','Unit 1'),('A5','Unit 1'),
('B1','Unit 1'),('B2','Unit 1'),('B3','Unit 1'),('B4','Unit 1'),('B5','Unit 1'),('B6','Unit 1'),('B7','Unit 1'),('B8','Unit 1'),('B9','Unit 1'),('B10','Unit 1'),('B11','Unit 1'),('B12','Unit 1'),('R1','Unit 1'),('R2','Unit 1'),('R3','Unit 1'),
('D1','Unit 2'),('D2','Unit 2'),('D3','Unit 2'),('D4','Unit 2'),('D5','Unit 2'),('D6','Unit 2'),('D7','Unit 2'),('D8','Unit 2'),('D9','Unit 2'),('D10','Unit 2'),
('E1','Unit 2'),('E2','Unit 2'),('E3','Unit 2'),('E4','Unit 2'),('E5','Unit 2'),('E6','Unit 2'),('E7','Unit 2'),('E8','Unit 2'),('E9','Unit 2'),('E10','Unit 2')
on conflict (panel_code) do nothing;
