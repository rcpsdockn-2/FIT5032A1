import { createEmailHttpHandler } from '../functions/emailHttp.js'

export default createEmailHttpHandler({
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  allowedRecipients: (process.env.EMAIL_ALLOWED_RECIPIENTS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
})
