# Backend migration notice

The CRM frontend has migrated from Supabase to Firebase Authentication and Cloud Firestore.

Use `../firestore.rules` in the Firebase Console under Firestore Database → Rules, then publish the rules. Follow `../README.md` for the current Firebase setup.

The files in this directory are legacy Supabase setup artifacts and are no longer used by the CRM. Do not run the old SQL scripts for the Firebase-backed application.
