# Firebase deployment

The app uses Firebase Hosting for `dist` and two Node 22 HTTP functions:

- `/functions/searchPlaces` → `searchPlaces`: independent, read-only directory search.
- `/api/send-email` → `sendEmail`: Firebase ID token verification and Resend mail.

Both functions run in `australia-southeast1`, with zero minimum instances and at
most one instance each. Hosting rewrites keep requests on the website's origin;
production never connects to a local development server. Hash routes such as
`/#/directory` can be opened directly and refreshed.

## Configuration and deployment

1. Use Node 22.16+ and run `npm ci` and `npm ci --prefix functions`.
2. Copy the root `.env.example` to `.env.local` and fill in the Firebase Web
   configuration. These public Web values identify the project; never put a
   server secret in a `VITE_` setting.
3. Copy `functions/.env.example` to `functions/.env.YOUR_PROJECT_ID`. Fill in
   `EMAIL_FROM` and the permitted recipient email. For Resend's test sender, only
   the Resend account's own email is supported. Keep real configuration ignored.
4. Sign in with the Firebase CLI if needed: `npx firebase login`.
5. In the intended project only, store a sending-only key with
   `npx firebase functions:secrets:set RESEND_API_KEY --project YOUR_PROJECT_ID`.
   Enter the key privately at its prompt. Only `sendEmail` binds this secret.
6. Run `npm test`, then
   `npx firebase deploy --only "functions,hosting" --project YOUR_PROJECT_ID`.
   Hosting's predeploy step builds the frontend. `.env.production` supplies the
   public same-origin search path, not credentials.
7. Set artifact cleanup for the function images, for example
   `npx firebase functions:artifacts:setpolicy --days 1 --location australia-southeast1 --project YOUR_PROJECT_ID`.
   This removes old build images, not source or running functions.

Deploying Functions requires Blaze and may incur charges. Do not deploy to an
unrelated project or assume a Git push performs deployment. No auto-deploy CI is
configured. Hosting uploads only `dist`; function packaging excludes environment
files, logs and installed dependencies. The CLI reads server environment values
separately, while Secret Manager keeps the sending key outside the source bundle.

## Verification

Run `node scripts/check-deployment.mjs https://YOUR_PROJECT_ID.web.app` for actual
HTTPS checks of the page, assets, query endpoint, input/method errors and unsigned
mail rejection. The script never sends email. In a browser, separately check:

1. Open `/#/account`, sign in, refresh and confirm the same account returns.
2. Open `/#/directory`, search E-waste + Footscray and select the result.
3. Select Melbourne CBD as origin and request directions. Confirm the road route,
   distance, estimated time and steps; these use public OSM/OSRM services.
4. Confirm both tables still filter, sort and paginate, including on a phone.
5. With permission to send a real test, use **Email my notes**, attach a small TXT
   and send once. Check the actual inbox/spam and open the received attachment.
6. Sign out and confirm Saved/Email are protected. Do not use browser console
   tricks to bypass the Firebase login.

For local emulation, copy `functions/.secret.example` to `.secret.local` for a fake
key and use a fake recipient in `functions/.env.local`. Do not copy the real key there or
let the Functions emulator retrieve a production secret. Local mail tests still
use `npm run dev:api` and the root ignored `.env.local`.

## Costs and limits

Zero minimum instances avoids deliberately keeping a function warm. Maximum
instances and the mail allowlist/cooldown reduce exposure but are not hard budget
caps. The cooldown is in memory, not shared durable rate limiting. Billing alerts
do not stop spending. A Functions service-level spend cap can pause that service,
but reporting/enforcement can lag and it does not cover all project services.
Builds, image storage, Hosting transfer and secrets can have separate charges.
Review actual billing and keep old image retention short; do not promise zero cost
or a guaranteed all-service spending ceiling. After assessment/interview, review
whether the deployed services are still needed before changing or removing them.

References:
- https://firebase.google.com/docs/hosting/functions
- https://firebase.google.com/docs/functions/config-env
- https://firebase.google.com/docs/functions/manage-functions
- https://firebase.google.com/docs/projects/billing/spend-caps
