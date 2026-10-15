import { validateEmailFields, validateAttachment } from '../src/services/emailValidation.js'

export const MAX_BODY_BYTES = 1500000

// Dependencies are supplied separately so tests never send real email.
export function createEmailHandler({ config, verifyToken, sendEmail, now = Date.now }) {
  const lastAttempt = new Map()
  return async function handleEmail({ method, authorization, body }) {
    if (method !== 'POST') return { status: 405, message: 'Use POST to send email.' }
    if (!config.apiKey || !config.projectId || !config.from || !config.allowedRecipients?.length) {
      return { status: 503, message: 'Email service is not configured. Please try again after setup.' }
    }
    if (!authorization?.startsWith('Bearer ')) return { status: 401, message: 'Please sign in before sending email.' }
    let user
    try {
      user = await verifyToken(authorization.slice(7))
    } catch {
      return { status: 401, message: 'Your session could not be checked. Sign in again.' }
    }
    const recipient = user.email?.toLowerCase()
    if (!user.uid || !recipient || !config.allowedRecipients.includes(recipient)) {
      return { status: 403, message: 'This account is not an approved email recipient yet.' }
    }
    let attachment
    try {
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid email request.')
      validateEmailFields(body.subject, body.message)
      if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.requestId)) throw new Error('Invalid request ID. Reload the page.')
      if (body.attachment != null) {
        const { filename, content } = body.attachment
        if (typeof content !== 'string' || content.length > 1398104 || !/^[A-Za-z0-9+/]*={0,2}$/.test(content)) throw new Error('Invalid attachment content.')
        const bytes = Buffer.from(content, 'base64')
        validateAttachment(filename, bytes.length)
        if (bytes.toString('base64') !== content) throw new Error('Invalid attachment encoding.')
        if (/\.pdf$/i.test(filename) && bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('The PDF file is not valid.')
        if (/\.txt$/i.test(filename)) {
          try { new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { throw new Error('TXT attachments must use UTF-8 text.') }
          if (bytes.includes(0)) throw new Error('TXT attachments must contain plain text.')
        }
        attachment = { filename, content }
      }
    } catch (issue) {
      return { status: 400, message: issue.message }
    }
    // A small per-process cooldown; provider quotas still apply across server instances.
    const time = now()
    for (const [uid, previous] of lastAttempt) if (time - previous >= 60000) lastAttempt.delete(uid)
    if (lastAttempt.has(user.uid)) return { status: 429, message: 'Please wait one minute before sending again.' }
    lastAttempt.set(user.uid, time)
    try {
      const result = await sendEmail({
        from: config.from,
        to: [recipient], // Never accept a recipient, sender or HTML body from the browser.
        subject: body.subject.trim(),
        text: body.message.trim(),
        ...(attachment ? { attachments: [attachment] } : {}),
      }, `${user.uid}/${body.requestId}`)
      if (!result?.id) throw new Error('Missing provider confirmation')
      return { status: 200, message: 'Email service accepted your message. Check your inbox and spam folder.' }
    } catch {
      return { status: 502, message: 'Delivery could not be confirmed. Check your inbox first; wait one minute before retrying the unchanged message.' }
    }
  }
}

export async function readEmailBody(request) {
  if (request.body !== undefined) {
    const raw = typeof request.body === 'string' ? request.body : JSON.stringify(request.body)
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw new Error('Request too large')
    return JSON.parse(raw)
  }
  let length = 0
  const chunks = []
  for await (const chunk of request) {
    length += chunk.length
    if (length > MAX_BODY_BYTES) throw new Error('Request too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
