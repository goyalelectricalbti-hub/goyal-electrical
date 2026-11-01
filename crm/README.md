# GOYAL ELECTRICAL CRM PRO

The CRM is hosted separately under `/crm`; the existing business website at the repository root is preserved.

## Open the CRM
https://goyalelectricalbti-hub.github.io/goyal-electrical/crm/

## Current technology
- GitHub Pages for hosting
- Firebase Authentication (email/password)
- Cloud Firestore for CRM records
- Firebase Spark (free) plan to start
- No Supabase and no BUSY integration

## First-time Firebase setup
1. In Firebase Console, open project `goyalelectricalcrm`.
2. Enable Authentication → Sign-in method → Email/Password.
3. Create the Cloud Firestore database.
4. Open Firestore → Rules, copy the contents of `firestore.rules` and Publish.
5. Open the CRM URL and create the first account. The first account automatically creates its own organization with Goyal Electrical and Goyal Enterprises.
6. Sign in and test with sample records before entering live customer information.

## Data structure
- `memberships/{uid}`: one user's organization and role.
- `organizations/{orgId}/companies/{companyId}`: company directory.
- `organizations/{orgId}/leads`, `customers`, `followups`, `sites`, `products`, `quotations`, `orders`: company-scoped CRM records.

## Current modules
Dashboard, leads, customers, follow-ups, sites/projects, product catalogue, quotation register, sales-order register, reports and CSV export.

## Important limitations
- Staff invitation and role-management screens are not yet implemented. The current first-account flow creates an administrator workspace; do not ask staff to self-register for a shared company workspace.
- Quotation line-item builder/PDF, purchase management, stock ledger, supplier management, file attachments and audit interface are not yet implemented.
- The CRM has not yet completed end-to-end testing against the live Firebase project. Use test data until login, create/edit/delete, company separation and security rules are verified.
- Firebase Spark has usage limits; free service is not unlimited. Review Firebase billing/usage dashboards regularly.
- Firebase web configuration values are public client identifiers. Never put service-account private keys or Admin SDK credentials in this repository.

## Existing site
Only files under `/crm` and the CRM deployment configuration are intended for the CRM. The main website at the repository root remains separate.
