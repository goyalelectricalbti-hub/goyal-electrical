# Supabase setup — GOYAL ELECTRICAL CRM

This is the cloud-backend foundation for the CRM in this folder. The current CRM UI still uses browser-local demo storage until the Supabase project is configured and the application is connected.

## 1. Create a free project
1. Create a Supabase account at https://supabase.com and create a new project.
2. Keep the database region close to India if available.
3. Open **SQL Editor → New query**.
4. Paste and run `schema.sql` from this folder.
5. In **Authentication → Providers**, enable Email. For initial testing, keep email confirmation enabled and add only approved staff accounts.

## 2. Keep credentials safe
- The browser may use only the Supabase project URL and the **anon/publishable** key.
- Never put the **service_role** key in HTML, JavaScript, GitHub, screenshots, or chat.
- Do not put customer data into a public demo project.
- Restrict sign-ups/invitations to staff who are authorized by the CRM administrator.

## 3. First administrator
The schema intentionally does not create a public self-service organization bootstrap. The first organization and admin membership must be provisioned through a trusted server-side setup action after the first admin account is created. Do not grant admin role from a browser form.

## 4. Roles
- **Admin:** organization settings, users, companies, full CRM administration.
- **Manager:** company setup, manage records, review team activity.
- **Sales:** leads, customers, follow-ups, sites, quotations and orders.
- **Accountant:** customer/product/order records and BUSY sync review.

Row-level security scopes records to organization membership. Company IDs support multiple BUSY companies under one organization. Verify role permissions with test accounts before entering live data.

## 5. Before live use
- Connect the CRM login/session to Supabase Auth.
- Replace localStorage CRUD with authenticated database calls.
- Add server-side organization creation/invitation and audit logging.
- Add file storage with private buckets and signed URLs.
- Test tenant isolation, role permissions, backups and restore.
- Keep BUSY sync disabled until the exact BUSY 21 build and supported XML/API/partner interface have been verified.

## Current status
**Schema foundation committed; not yet connected to the running CRM.** Existing website root files are untouched. No demo records have been imported.
