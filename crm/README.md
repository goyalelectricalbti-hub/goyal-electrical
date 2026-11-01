# GOYAL ELECTRICAL CRM

A separate CRM workspace added under `/crm`. Existing website files at the repository root are not modified.

## Open the prototype
If GitHub Pages is enabled for this repository, open:
`https://goyalelectricalbti-hub.github.io/goyal-electrical/crm/`

## Current prototype features
- Dashboard and lead pipeline
- Customer records
- Follow-ups and tasks
- Site/project list
- Product catalogue
- Quotation and sales-order registers
- CSV export
- Company selector and BUSY integration setup screen
- Responsive desktop/mobile layout
- Browser-local demo workspace storage

## Important status and limitations
This commit creates a **front-end prototype**, not a production multi-user cloud CRM. Records are stored in the current browser using localStorage and are not synchronized across devices or users. Authentication, role-based authorization, cloud PostgreSQL, server-side audit logs, document storage, and production backups are not implemented in this prototype.

BUSY 21 Standard is **not connected**. The connector status is deliberately shown as not connected. Do not treat sample/demo product prices or records as accounting data.

## BUSY connector implementation boundary
Target: Windows 10/11 Pro local computer, BUSY 21 Standard single-user installation, multiple BUSY companies, 15-minute sync schedule.

Before building/activating a Windows service:
1. Record exact BUSY build/version and installation paths.
2. Enumerate exact BUSY company names and confirm each company's data access.
3. Verify the officially supported XML/API/partner integration mechanism with BUSY.
4. Test export/import against a test company and reconcile master/voucher/stock/ledger totals.
5. Implement company-scoped mapping, cursor, idempotency key, retry queue, audit events and reconciliation.
6. Use outbound HTTPS from the local connector; do not expose BUSY database or RDP publicly.
7. Permit CRM-to-BUSY writes only after explicit approval and supported import confirmation.

No automatic posting of finalized accounting vouchers.

## Supabase authentication connection added
- The browser app now initializes Supabase Auth with the project's URL and publishable key, provides staff sign-in/sign-up, checks organization membership, and offers sign-out.
- The browser status deliberately says `SECURE LOGIN · LOCAL DATA`: CRM records are still held in browser localStorage and are not yet cloud-synchronized.
- Apply `supabase/schema.sql`, then `supabase/grants.sql`; create/confirm the first staff login, then run `supabase/bootstrap_first_admin.sql` after replacing the placeholder email.

## Backend foundation added
- `supabase/schema.sql` defines the cloud PostgreSQL tables for organizations, staff roles, companies, leads, customers, follow-ups, sites, products, quotations, sales orders, BUSY sync runs and audit events.
- Row-level security policies scope data to organization membership and separate Admin, Manager, Sales and Accountant permissions.
- `supabase/SETUP.md` explains how to create a free Supabase project and apply the schema safely.
- This is a schema foundation only. The CRM browser app is not yet connected to Supabase; authentication and live cloud CRUD require a configured Supabase project and app integration.

## Next production milestones
- Replace localStorage CRUD with authenticated Supabase queries and company-scoped cloud records.
- Add managed authentication and Admin/Manager/Sales/Accountant roles.
- Add cloud database schema, migrations and server APIs.
- Add file/photo storage and quotation PDF generation.
- Build and sign the Windows connector after BUSY interface verification.
- Add automated 15-minute scheduling, heartbeat, monitoring, retries and reconciliation.
- Test multi-company isolation and disaster recovery before go-live.
