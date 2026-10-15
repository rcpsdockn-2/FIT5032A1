# Firebase Web setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` in the project root.
3. Fill in the six Web app settings from Firebase Console → Project settings → Your apps.
4. Run `npm run dev`. Restart the server after changing environment values.
5. Open My account → Cloud account setup → Check Firebase setup.

The check initializes the Authentication and Firestore SDK clients. It does not
verify a cloud sign-in, create a user, provision a database or test database rules.
The account form currently still uses the existing local demo accounts.

`.env.local` is ignored by Git. Vite includes `VITE_` values in browser builds;
they are not a place for passwords, email service keys or service-account private keys.
Firebase Web configuration identifies the project; access control must use Firebase
Authentication and database security rules, not secrecy of these Web settings.

Run `npm test` and `npm run build` to check the project. A build without Firebase
configuration is supported; My account will explain that cloud setup is missing.

References:
- https://firebase.google.com/docs/web/setup
- https://vite.dev/guide/env-and-mode
