-- Run after schema.sql in Supabase SQL Editor. Grants authenticated users access
-- to the API surface; row-level security policies in schema.sql still decide each row.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.organizations,
 public.organization_members, public.crm_companies, public.customers, public.leads,
 public.followups, public.sites, public.products, public.quotations, public.sales_orders,
 public.busy_sync_runs, public.audit_events to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid,text[]) to authenticated;
