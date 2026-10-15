import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { createEmailHandler, readEmailBody } from './emailHandler.js'

export function createEmailHttpHandler(config) {
  const handleEmail = createEmailHandler({
    config,
    verifyToken(token) {
      const app = getApps().find((item) => item.name === 'cyclewise-mail')
        || initializeApp({ projectId: config.projectId }, 'cyclewise-mail')
      return getAuth(app).verifyIdToken(token)
    },
    async sendEmail(payload, requestId) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': requestId },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new Error('Email provider rejected request')
      return response.json()
    },
  })

  return async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Content-Type', 'application/json')
    if (request.method !== 'POST') response.setHeader('Allow', 'POST')
    let body
    if (request.method === 'POST') {
      if (!request.headers['content-type']?.startsWith('application/json')) {
        response.statusCode = 415
        return response.end(JSON.stringify({ message: 'Use a JSON request.' }))
      }
      try { body = await readEmailBody(request) } catch {
        response.statusCode = 400
        return response.end(JSON.stringify({ message: 'Invalid or oversized email request.' }))
      }
    }
    const result = await handleEmail({ method: request.method, authorization: request.headers.authorization, body })
    response.statusCode = result.status
    response.end(JSON.stringify({ message: result.message }))
  }
}
