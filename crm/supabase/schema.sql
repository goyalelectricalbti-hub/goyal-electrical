-- GOYAL ELECTRICAL CRM: Supabase/PostgreSQL foundation
-- Apply this file in a NEW Supabase project's SQL Editor.
-- This migration creates schema only; it does not import localStorage demo records.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','manager','sales','accountant')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  busy_company_name text,
  busy_status text not null default 'not_connected'
    check (busy_status in ('not_connected','pending_verification','connected','error')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(target_org uuid, allowed_roles text[])
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  name text not null,
  contact_person text,
  phone text,
  email text,
  city text,
  customer_type text,
  address text,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  business_name text not null,
  contact_person text,
  phone text,
  email text,
  source text,
  stage text not null default 'New',
  estimated_value numeric(14,2) not null default 0,
  assigned_to uuid references auth.users(id) on delete set null,
  next_follow_up date,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  due_at timestamptz,
  status text not null default 'Pending',
  assigned_to uuid references auth.users(id) on delete set null,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  location text,
  status text not null default 'New',
  site_contact text,
  expected_value numeric(14,2) not null default 0,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  sku text,
  name text not null,
  brand text,
  category text,
  unit text,
  indicative_price numeric(14,2),
  busy_item_code text,
  last_busy_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, company_id, sku)
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quotation_number text not null,
  quotation_date date not null default current_date,
  valid_until date,
  amount numeric(14,2) not null default 0,
  status text not null default 'Draft',
  items jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, company_id, quotation_number)
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quotation_id uuid references public.quotations(id) on delete set null,
  order_number text not null,
  order_date date not null default current_date,
  amount numeric(14,2) not null default 0,
  status text not null default 'Pending',
  busy_voucher_reference text,
  busy_posting_status text not null default 'not_requested'
    check (busy_posting_status in ('not_requested','pending_review','approved','posted','failed')),
  items jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, company_id, order_number)
);

create table if not exists public.busy_sync_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.crm_companies(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  direction text not null check (direction in ('busy_to_crm','crm_to_busy')),
  status text not null default 'queued'
    check (status in ('queued','running','success','partial','failed')),
  records_read integer not null default 0,
  records_written integer not null default 0,
  error_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable row-level security on every tenant-owned table.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.crm_companies enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.followups enable row level security;
alter table public.sites enable row level security;
alter table public.products enable row level security;
alter table public.quotations enable row level security;
alter table public.sales_orders enable row level security;
alter table public.busy_sync_runs enable row level security;
alter table public.audit_events enable row level security;

-- Profile: users can read/update only their own profile.
drop policy if exists "profile self access" on public.profiles;
create policy "profile self access" on public.profiles
for all using (id = auth.uid()) with check (id = auth.uid());

-- Organization and membership visibility.
drop policy if exists "members read organization" on public.organizations;
create policy "members read organization" on public.organizations
for select using (public.is_org_member(id));
drop policy if exists "admins update organization" on public.organizations;
create policy "admins update organization" on public.organizations
for update using (public.has_org_role(id, array['admin'])) with check (public.has_org_role(id, array['admin']));

drop policy if exists "members read membership" on public.organization_members;
create policy "members read membership" on public.organization_members
for select using (public.is_org_member(organization_id));
drop policy if exists "admins manage membership" on public.organization_members;
create policy "admins manage membership" on public.organization_members
for all using (public.has_org_role(organization_id, array['admin']))
with check (public.has_org_role(organization_id, array['admin']));

-- Company directory: all members can read; admins/managers can maintain it.
drop policy if exists "members read companies" on public.crm_companies;
create policy "members read companies" on public.crm_companies
for select using (public.is_org_member(organization_id));
drop policy if exists "managers manage companies" on public.crm_companies;
create policy "managers manage companies" on public.crm_companies
for all using (public.has_org_role(organization_id, array['admin','manager']))
with check (public.has_org_role(organization_id, array['admin','manager']));

-- Business records: all organization members can read; role-based writes.
do $$
declare t text;
begin
  foreach t in array array['customers','leads','followups','sites','products','quotations','sales_orders'] loop
    execute format('drop policy if exists "members read %I" on public.%I', t, t);
    execute format('create policy "members read %I" on public.%I for select using (public.is_org_member(organization_id))', t, t);
    execute format('drop policy if exists "staff insert %I" on public.%I', t, t);
    execute format('create policy "staff insert %I" on public.%I for insert with check (public.has_org_role(organization_id, array[''admin'',''manager'',''sales'',''accountant'']))', t, t);
    execute format('drop policy if exists "staff update %I" on public.%I', t, t);
    execute format('create policy "staff update %I" on public.%I for update using (public.has_org_role(organization_id, array[''admin'',''manager'',''sales'',''accountant''])) with check (public.has_org_role(organization_id, array[''admin'',''manager'',''sales'',''accountant'']))', t, t);
    execute format('drop policy if exists "managers delete %I" on public.%I', t, t);
    execute format('create policy "managers delete %I" on public.%I for delete using (public.has_org_role(organization_id, array[''admin'',''manager'']))', t, t);
  end loop;
end $$;

drop policy if exists "members read sync runs" on public.busy_sync_runs;
create policy "members read sync runs" on public.busy_sync_runs
for select using (public.is_org_member(organization_id));
drop policy if exists "accountants manage sync runs" on public.busy_sync_runs;
create policy "accountants manage sync runs" on public.busy_sync_runs
for all using (public.has_org_role(organization_id, array['admin','accountant']))
with check (public.has_org_role(organization_id, array['admin','accountant']));

drop policy if exists "admins read audit events" on public.audit_events;
create policy "admins read audit events" on public.audit_events
for select using (public.has_org_role(organization_id, array['admin']));
drop policy if exists "members insert audit events" on public.audit_events;
create policy "members insert audit events" on public.audit_events
for insert with check (public.is_org_member(organization_id) and actor_id = auth.uid());

create index if not exists idx_customers_org on public.customers(organization_id);
create index if not exists idx_leads_org_stage on public.leads(organization_id, stage);
create index if not exists idx_followups_org_due on public.followups(organization_id, due_at);
create index if not exists idx_sites_org on public.sites(organization_id);
create index if not exists idx_products_org_sku on public.products(organization_id, sku);
create index if not exists idx_quotations_org_date on public.quotations(organization_id, quotation_date);
create index if not exists idx_orders_org_date on public.sales_orders(organization_id, order_date);
create index if not exists idx_audit_org_created on public.audit_events(organization_id, created_at desc);

-- Important: create the first organization and its admin membership through a trusted
-- server-side setup process. Never expose the Supabase service-role key in browser code.
