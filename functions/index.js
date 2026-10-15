import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { createPlaceSearchHandler } from './searchPlaces.js'
import { createEmailHttpHandler } from './emailHttp.js'

const resendKey = defineSecret('RESEND_API_KEY')

// Public, read-only sample data. Use a same-origin proxy, not broad CORS access.
export const searchPlaces = onRequest({
  region: 'australia-southeast1', cors: false, minInstances: 0, maxInstances: 1,
  concurrency: 10,
  timeoutSeconds: 10, memory: '256MiB',
}, createPlaceSearchHandler())

// Read the secret only at runtime, not while Firebase inspects the deployment.
let emailHandler
export const sendEmail = onRequest({
  region: 'australia-southeast1', cors: false, minInstances: 0, maxInstances: 1,
  concurrency: 1, timeoutSeconds: 30, memory: '256MiB', secrets: [resendKey],
}, (request, response) => {
  emailHandler ||= createEmailHttpHandler({
    apiKey: resendKey.value(),
    projectId: process.env.GCLOUD_PROJECT,
    from: process.env.EMAIL_FROM,
    allowedRecipients: (process.env.EMAIL_ALLOWED_RECIPIENTS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
  })
  return emailHandler(request, response)
})
