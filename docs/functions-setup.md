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
3. `npm run dev:functions` in a separate terminal.
4. `npm run dev` in another terminal; open its displayed address.
5. Go to **Places & events → Find a sample place**.
6. Select **E-waste** and type **Footscray**. Search returns one sample place.
7. Change category to **Repair** with the same suburb. Search returns no matches.
8. Stop the emulator and search again: an error appears, not fake local results.

The CLI is installed in this project's development dependencies, not globally.
Only Functions is emulated; Java is not needed for this configuration. The scripts
use `demo-cyclewise`, not the live Firebase project, and bind to `127.0.0.1`.
No sign-in, billing change or deployment is performed by these scripts. Firebase
may report credentials already present on your machine; this function never
initializes Admin or calls a non-emulated service. Do not add production API
access to this demo function without reviewing its environment.

The target runtime is Node 22. A newer local Node may produce an engine/runtime
warning and be used by the emulator instead. Current local checks use Node 24;
that does not certify the future deployed Node 22 environment.

## Tests

- `npm test`: validation, shared data, combined filters, no results, 400/405/500
  handlers, frontend response/error handling and production endpoint safeguards.
- `npm run test:functions`: starts the actual Firebase Functions emulator, runs
  real HTTP checks and stops it. Stop a manually running emulator first to avoid
  port conflicts. Server exceptions are tested by injecting a failing search
  function in unit tests, not by exposing a production debug/failure endpoint.
- `npm run build`: checks the production frontend build.

## Production is a separate step

This round supplies local integration, not a deployed cloud function. Firebase
requires a Blaze billing plan to deploy Functions. Do not upgrade billing or run
deployment commands without approval; a maximum instance setting is not a hard
spending cap. E.1 production availability remains pending until deployment and
online checks are complete.

Vite's development proxy sends `/functions/searchPlaces` to the local emulator.
Production **never** falls back to localhost. Set `VITE_PLACES_FUNCTION_URL` to a
same-origin path backed by a hosting/server rewrite when deployment is approved.
The function disables cross-origin browser access; a direct cross-origin HTTPS
URL needs an explicitly reviewed CORS policy before it can be used. Missing
production configuration displays an error while the original tables remain usable.

The function folder is packaged independently and must not import private files
from the repository root. Its `firebase.json` ignore list excludes dependencies,
environment files and logs from a future function upload. No service-account key
or `.env.local` copy belongs in this folder.

References:
- https://firebase.google.com/docs/functions/local-emulator
- https://firebase.google.com/docs/functions/http-events
- https://firebase.google.com/docs/functions/get-started
- https://firebase.google.com/docs/functions/manage-functions
