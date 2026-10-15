# Firebase Web setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` in the project root.
3. Fill in the six Web app settings from Firebase Console → Project settings → Your apps.
4. Run `npm run dev`. Restart the server after changing environment values.
5. In Firebase Console, enable Authentication → Email/Password.
6. Open My account to create a cloud account or sign in. Registration signs you in automatically.

The app restores Firebase sessions on startup using browser-local persistence.
Sign out on shared computers. Missing configuration disables cloud account forms;
public guides and tables remain available. There is no silent local-login fallback.

Old browser-only accounts are not migrated, removed or granted cloud access. Create
a new Firebase account, even if the same email was used in the old local version.
Saved guides and ratings still live in the browser, keyed by `firebase:` plus the
Firebase UID. They do not sync across devices and are not protected server data.
No Firestore database is used; the app initializes only Firebase Authentication.

The old shared demo administrator is not a cloud administrator. Cloud admin UI
requires a boolean `admin` custom claim assigned from a trusted server environment.
Its legacy account view is read-only and is not a list of all Firebase users.

The account flow stays in `src/services/auth.js`: validate inputs, call Firebase,
then let `onAuthStateChanged` update the visible identity. An account change first
clears the old administrator status. A simple increasing `sessionVersion` number
makes late permission responses harmless after logout or another login. Stopping
the subscription also ignores any response still in flight. This does not replace
server checks: the email function verifies the Firebase ID token independently.

`.env.local` is ignored by Git. Vite includes `VITE_` values in browser builds;
they are not a place for passwords, email service keys or service-account private keys.
Firebase Web configuration identifies the project; access control must use Firebase
Authentication and database security rules, not secrecy of these Web settings.

Run `npm test` and `npm run build` to check the project. A build without Firebase
configuration is supported; My account will explain that cloud setup is missing.
The unit tests use an in-memory SDK substitute and do not create real cloud users.
Real registration, login, reload recovery and sign-out must also be tested in a browser.

References:
- https://firebase.google.com/docs/web/setup
- https://vite.dev/guide/env-and-mode
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/auth/web/auth-state-persistence
