<script setup>
import { nextTick, ref } from 'vue'
import { getFirebaseServices } from '../services/firebase.js'
import { validateEmailFields, validateAttachment } from '../services/emailValidation.js'

const props = defineProps({ currentUser: { type: Object, required: true } })
const subject = ref('')
const message = ref('')
const fileInput = ref(null)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const feedback = ref(null)
let requestId = crypto.randomUUID()

function changed() {
  requestId = crypto.randomUUID()
  error.value = ''
  notice.value = ''
}

function readAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ filename: file.name, content: reader.result.split(',')[1] })
    reader.onerror = () => reject(new Error('The attachment could not be read. Choose it again.'))
    reader.readAsDataURL(file)
  })
}

async function send() {
  if (busy.value) return
  error.value = ''
  notice.value = ''
  busy.value = true
  const userId = props.currentUser.id
  try {
    validateEmailFields(subject.value, message.value)
    const file = fileInput.value?.files[0]
    if (file) validateAttachment(file.name, file.size)
    const attachment = file ? await readAttachment(file) : null
    const { auth } = await getFirebaseServices()
    if (!auth.currentUser || `firebase:${auth.currentUser.uid}` !== userId) throw new Error('Please sign in again before sending.')
    const token = await auth.currentUser.getIdToken()
    if (`firebase:${auth.currentUser?.uid}` !== userId) throw new Error('Your account changed. Please try again.')
    let response
    try {
      response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: subject.value, message: message.value, attachment, requestId }),
        signal: AbortSignal.timeout(25000),
      })
    } catch { throw new Error('Could not confirm delivery. Check your inbox before retrying the unchanged message.') }
    let result
    try { result = await response.json() } catch { throw new Error('Email API is unavailable. Check that the backend is running.') }
    if (!response.ok) throw new Error(result.message || 'Email could not be sent.')
    if (typeof result.message !== 'string') throw new Error('Invalid email service response.')
    notice.value = result.message
    subject.value = ''
    message.value = ''
    if (fileInput.value) fileInput.value.value = ''
    requestId = crypto.randomUUID()
  } catch (issue) {
    error.value = issue.message
  } finally {
    busy.value = false
    await nextTick()
    feedback.value?.focus()
  }
}
</script>

<template>
  <section class="page-content" aria-labelledby="email-title">
    <div class="account-panel">
      <p class="eyebrow">Keep a useful note</p>
      <h1 id="email-title">Email my notes</h1>
      <p>Send a recycling note to your own account email. You can attach one TXT or PDF file up to 1 MB.</p>
      <p>Only approved test recipients can receive mail during setup. Do not attach private or sensitive files.</p>
      <form class="account-form" novalidate :aria-busy="busy" @submit.prevent="send">
        <div><label for="email-recipient">Recipient (your account)</label>
          <input id="email-recipient" :value="currentUser.email" type="email" readonly /></div>
        <div><label for="email-subject">Subject</label>
          <input id="email-subject" v-model="subject" maxlength="120" required :disabled="busy" aria-describedby="email-feedback" @input="changed" /></div>
        <div><label for="email-message">Message</label>
          <textarea id="email-message" v-model="message" rows="6" maxlength="3000" required :disabled="busy" aria-describedby="email-feedback" @input="changed"></textarea></div>
        <div><label for="email-file">Attachment (optional)</label>
          <input id="email-file" ref="fileInput" type="file" accept=".txt,.pdf" :disabled="busy" aria-describedby="email-file-help email-feedback" @change="changed" />
          <p id="email-file-help" class="account-note">TXT or PDF, non-empty, maximum 1 MB. Use a simple English filename.</p></div>
        <button type="submit" class="primary-button" :disabled="busy">{{ busy ? 'Sending…' : 'Send email' }}</button>
      </form>
      <div id="email-feedback" ref="feedback" tabindex="-1">
        <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>
        <p v-if="notice" class="form-message" role="status">{{ notice }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
textarea { width: 100%; box-sizing: border-box; padding: 0.8rem; border: 1px solid #8799a6; border-radius: 6px; font: inherit; resize: vertical; }
input[type="file"] { max-width: 100%; }
</style>
