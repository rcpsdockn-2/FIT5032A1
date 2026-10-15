export const MAX_ATTACHMENT_BYTES = 1024 * 1024

export function validateEmailFields(subject, message) {
  if (typeof subject !== 'string' || !subject.trim() || subject.trim().length > 120 || /[\r\n]/.test(subject)) {
    throw new Error('Enter a subject of 1–120 characters on one line.')
  }
  if (typeof message !== 'string' || !message.trim() || message.trim().length > 3000) {
    throw new Error('Enter a message of 1–3000 characters.')
  }
}

export function validateAttachment(name, size) {
  if (typeof name !== 'string' || !/^[a-z0-9][a-z0-9._ -]{0,79}\.(txt|pdf)$/i.test(name) || name.includes('..')) {
    throw new Error('Choose a TXT or PDF file with a simple English filename (up to 84 characters).')
  }
  if (!Number.isInteger(size) || size < 1 || size > MAX_ATTACHMENT_BYTES) {
    throw new Error('The attachment must be non-empty and no larger than 1 MB.')
  }
}
