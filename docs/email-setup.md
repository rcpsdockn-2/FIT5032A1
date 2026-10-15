# Email with attachments

The signed-in user can email a note to their own account address. One optional
TXT or PDF attachment is supported (1 MB maximum). The server checks a Firebase
ID token, server-side recipient allowlist, fields, attachment and a one-minute
per-user cooldown. The recipient and sender cannot be changed by the browser.

## Local setup

1. Run `npm ci` (Node 22.16+ or 24 recommended).
2. Keep the Firebase Web values in ignored `.env.local`.
3. Add `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_ALLOWED_RECIPIENTS` and
   `FIREBASE_PROJECT_ID`, following `.env.example`.
4. Use a sending-only Resend key. Do not put it in any `VITE_` variable.
5. For Resend's test sender, use `CycleWise <onboarding@resend.dev>` and the email
   belonging to your Resend account as the sole approved recipient. Other recipients
   require an appropriate verified sending domain and explicit approval.
6. In one terminal, run `npm run dev:api` (localhost:8787).
7. In another, run `npm run dev` and open the displayed address.
8. Sign in and open **Email my notes**. Enter a subject/message and attach a small
   non-sensitive TXT or PDF. Send once and check the inbox/spam folder and attachment.

Restart the API after changing `.env.local`. Never commit keys or private files.
No service-account private key is needed for this token-verification-only API:
Firebase Admin checks signed ID tokens against Google's public certificates and
the configured project ID. It does not list users or send mail through Firebase.
Revocation/disabled-user checks are not performed; existing ID tokens last up to
their expiry. No Firebase Auth emulator token bypass is enabled.

## Status and limitations

Only a confirmed provider response produces the success message. This means
accepted for sending, not guaranteed inbox delivery. If a request times out, check
the inbox before retrying. An unchanged form reuses its request ID, and Resend's
24-hour idempotency window avoids duplicate sends for that same payload. Editing
the form or reloading creates a new ID; do not resubmit blindly after doing so.

The cooldown is per Node process and resets on restart. It is not distributed
rate limiting; retain the recipient allowlist and provider's free quota limits.
No attachments or email contents are logged or saved to disk by the server.
TXT encoding and PDF header are checked, but this is not a malware scanner.

`npm test` uses fake token checks and a fake mail provider: no real emails. Real
inbox delivery and opening the attachment remain a separate manual acceptance
check. Missing configuration returns 503 instead of pretending to send.

`api/send-email.js` is an HTTP handler shared by the local server and a future
compatible Node serverless host. Uploading only Vite's `dist` directory does not
deploy this API. Production hosting and server environment variables must be
configured and tested separately; no deployment is performed by these scripts.
This mail handler is not the independent Firebase Cloud Function requirement.

References:
- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/knowledge-base/what-if-i-dont-own-a-domain
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
