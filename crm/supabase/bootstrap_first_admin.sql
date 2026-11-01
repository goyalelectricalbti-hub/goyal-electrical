-- Run this only AFTER creating your first staff account and confirming its email.
-- Replace the email below with the exact email used for the first CRM administrator.
-- Run once in Supabase Dashboard -> SQL Editor.
do $$
declare
  admin_email text := 'REPLACE_WITH_ADMIN_EMAIL';
  admin_user_id uuid;
  org_id uuid;
begin
  select id into admin_user_id from auth.users where lower(email)=lower(admin_email) limit 1;
  if admin_user_id is null then
    raise exception 'No confirmed Supabase Auth user found for %. Create the account and confirm its email first.', admin_email;
  end if;

  select organization_id into org_id
  from public.organization_members
  where user_id=admin_user_id
  limit 1;

  if org_id is null then
    insert into public.organizations(name,created_by)
    values ('GOYAL ELECTRICAL',admin_user_id)
    returning id into org_id;

    insert into public.organization_members(organization_id,user_id,role)
    values (org_id,admin_user_id,'admin');
  end if;

  insert into public.crm_companies(organization_id,name)
  values (org_id,'Goyal Electrical'),(org_id,'Goyal Enterprises')
  on conflict (organization_id,name) do nothing;
end $$;

select o.name as organization, m.role, c.name as crm_company
from public.organizations o
join public.organization_members m on m.organization_id=o.id
left join public.crm_companies c on c.organization_id=o.id
where m.user_id=(select id from auth.users where lower(email)=lower('REPLACE_WITH_ADMIN_EMAIL') limit 1);
