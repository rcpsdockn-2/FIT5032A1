# Directory Cloud Function

`functions/index.js` exports the independent Firebase HTTP function `searchPlaces`.
It is not the email API. The function validates `category` and `suburb`, filters
the public sample directory and returns `{ places, count }`. It does not access
Firebase user accounts, Firestore, email keys or other cloud services.

The 12 fictional places live in `functions/data/places.js`. The original table
imports the same data so names and categories cannot drift between two copies.
Only the search request is handled on the server; the existing table's sorting,
column filters and pagination still work independently in the browser.

## Local use

From the repository root:

1. `npm ci`
2. `npm ci --prefix functions`
3. Copy `functions/.secret.example` to `functions/.secret.local` (fake key only).
   Copy `functions/.env.example` to `functions/.env.local` and use a fake recipient,
   such as `member@example.com`. These overrides are for the demo emulator only.
4. `npm run dev:functions` in a separate terminal.
5. `npm run dev` in another terminal; open its displayed address.
6. Go to **Places & events → Find a sample place**.
7. Select **E-waste** and type **Footscray**. Search returns one sample place.
8. Change category to **Repair** with the same suburb. Search returns no matches.
9. Stop the emulator and search again: an error appears, not fake local results.

The CLI is installed in this project's development dependencies, not globally.
Only Functions is emulated; Java is not needed for this configuration. The scripts
use `demo-cyclewise`, not the live Firebase project, and bind to `127.0.0.1`.
No sign-in, billing change or deployment is performed by these scripts. Firebase
may report credentials already present on your machine; `searchPlaces` never
initializes Admin or calls a non-emulated service. `sendEmail` is also exported,
but these emulator checks only send unsigned requests that cannot send mail.
Use the fake secret override so the emulator never fetches the live sending key.

The target runtime is Node 22. A newer local Node may produce an engine/runtime
warning and be used by the emulator instead. Local checks use Node 24; cloud
deployment uses Node 22 and needs its own online checks.

## Tests

- `npm test`: validation, shared data, combined filters, no results, 400/405/500
  handlers, frontend response/error handling and production endpoint safeguards.
- `npm run test:functions`: starts the actual Firebase Functions emulator, runs
  real HTTP checks and stops it. Stop a manually running emulator first to avoid
  port conflicts. Server exceptions are tested by injecting a failing search
  function in unit tests, not by exposing a production debug/failure endpoint.
- `npm run build`: checks the production frontend build.

## Production is a separate step

Firebase requires a Blaze billing plan to deploy Functions. Deployment and
verification instructions are in `docs/deployment.md`; a maximum instance setting
is not a hard spending cap. The independent `searchPlaces` function remains
separate from the `sendEmail` function, although both share one deployment folder.

Vite's development proxy sends `/functions/searchPlaces` to the local emulator.
Production **never** falls back to localhost. Set `VITE_PLACES_FUNCTION_URL` to a
same-origin path backed by a hosting/server rewrite when deployment is approved.
The function disables cross-origin browser access; a direct cross-origin HTTPS
URL needs an explicitly reviewed CORS policy before it can be used. Missing
production configuration displays an error while the original tables remain usable.

The function folder is packaged independently and must not import private files
from the repository root. Its `firebase.json` ignore list excludes dependencies,
environment files and logs from the function upload. No service-account key
or `.env.local` copy belongs in this folder.

References:
- https://firebase.google.com/docs/functions/local-emulator
- https://firebase.google.com/docs/functions/http-events
- https://firebase.google.com/docs/functions/get-started
- https://firebase.google.com/docs/functions/manage-functions
