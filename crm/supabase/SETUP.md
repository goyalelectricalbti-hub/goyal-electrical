# Supabase setup — GOYAL ELECTRICAL CRM

The CRM is now connected in the browser to Supabase Auth and cloud CRUD. GitHub Pages serves the front end; Supabase stores the CRM data. Complete these one-time steps before using it with real customer records.

## 1. Prepare the database
1. Open the Supabase project used by the CRM.
2. In **SQL Editor → New query**, paste and run `schema.sql`.
3. Run `grants.sql` in a second query.
4. In **Authentication → Providers**, enable Email. Keep email confirmation enabled.
5. In **Authentication → URL Configuration**, add the deployed CRM URL to Site URL / Redirect URLs if Supabase requests it:
   `https://goyalelectricalbti-hub.github.io/goyal-electrical/crm/`

## 2. Create the first administrator
1. Open the CRM and choose **Create staff account**.
2. Register the email address that should own the CRM administrator account.
3. Open that email and confirm the Supabase verification link.
4. In Supabase **SQL Editor**, open `bootstrap_first_admin.sql`.
5. Replace BOTH occurrences of `REPLACE_WITH_ADMIN_EMAIL` with the exact confirmed email address, then run the script.
6. Return to the CRM and sign in with that email and password. The account should show the Admin role and the two companies: Goyal Electrical and Goyal Enterprises.

The first-admin SQL must be run by the project owner in the Supabase dashboard. Do not share the Supabase service_role key with anyone or place it in browser code.

## 3. Add staff
Staff can create an Auth account, but they cannot grant themselves access. After their email is confirmed, an existing administrator must add their user to `organization_members` with one of these roles: `manager`, `sales`, or `accountant`. Keep administrator access restricted.

## 4. Verify before live use
- Sign in as the administrator and create a test customer and lead.
- Refresh the page and confirm the records remain.
- Test a second staff account and confirm it cannot access another organization.
- Use test records until permissions, backups and restore have been checked.

## Current limitations
- BUSY 21 is **not connected** yet. The BUSY panel is a status/placeholder; no automatic sync or posting is taking place.
- Product bulk import, quotation PDF/line items, file attachments and staff invitation screens are not implemented yet.
- The app uses the Supabase publishable key in the browser, which is expected; never use a service_role/secret key in the front end.
