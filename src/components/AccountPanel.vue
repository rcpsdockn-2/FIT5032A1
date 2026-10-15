<script setup>
import { nextTick, ref } from 'vue'
import { register, signIn, signOut } from '../services/auth'

defineProps({
  currentUser: { type: Object, default: null },
  authReady: Boolean,
  authError: { type: String, default: '' },
})
const emit = defineEmits(['session-change'])

const mode = ref('signin')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmation = ref('')
const error = ref('')
const notice = ref('')
const busy = ref(false)
const feedback = ref(null)

function changeMode(value) {
  mode.value = value
  password.value = ''
  confirmation.value = ''
  error.value = ''
  notice.value = ''
}

async function submitAccount() {
  if (busy.value) return
  error.value = ''
  notice.value = ''
  busy.value = true
  try {
    if (mode.value === 'register') {
      await register(name.value, email.value, password.value, confirmation.value)
      mode.value = 'signin'
      emit('session-change')
      notice.value = 'Account created. You are signed in.'
    } else {
      await signIn(email.value, password.value)
      emit('session-change')
      notice.value = 'You are signed in.'
    }
    password.value = ''
    confirmation.value = ''
  } catch (issue) {
    error.value = issue.message
  } finally {
    busy.value = false
    await nextTick()
    feedback.value?.focus()
  }
}

async function logout() {
  if (busy.value) return
  busy.value = true
  try {
    await signOut()
    emit('session-change')
    changeMode('signin')
    notice.value = 'You have signed out.'
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
  <section class="page-content" aria-labelledby="account-title">
    <div class="account-panel">
      <p class="eyebrow">CycleWise community</p>
      <h1 id="account-title">My account</h1>
      <p class="account-note">Sign in securely with Firebase. On a shared computer, sign out when you finish.</p>
      <p class="account-note">Old browser-only accounts have not been migrated. Create a cloud account to continue; old saved data has not been deleted.</p>

      <div v-if="currentUser" class="account-details">
        <!-- Vue escapes user text here; never render account input with v-html.
             https://vuejs.org/guide/best-practices/security.html -->
        <h2>Welcome, {{ currentUser.name }}</h2>
        <p>{{ currentUser.email }}</p>
        <p>Role: {{ currentUser.role === 'admin' ? 'Admin' : 'Member' }}</p>
        <p><a href="#/saved">View my saved items</a></p>
        <p v-if="currentUser.role === 'admin'"><a href="#/admin">Open admin page</a></p>
        <button class="primary-button" type="button" :disabled="busy" @click="logout">{{ busy ? 'Please wait…' : 'Sign out' }}</button>
      </div>

      <template v-else>
        <div class="category-picker" role="group" aria-label="Account options">
          <button class="category-button" type="button" :aria-pressed="mode === 'signin'"
            :class="{ 'category-button--selected': mode === 'signin' }" :disabled="busy"
            @click="changeMode('signin')">Sign in</button>
          <button class="category-button" type="button" :aria-pressed="mode === 'register'"
            :class="{ 'category-button--selected': mode === 'register' }" :disabled="busy"
            @click="changeMode('register')">Create account</button>
        </div>

        <form class="account-form" novalidate :aria-busy="busy" aria-describedby="account-feedback" @submit.prevent="submitAccount">
          <div v-if="mode === 'register'">
            <label for="account-name">Name</label>
            <input id="account-name" v-model="name" autocomplete="name" maxlength="50" required :disabled="busy" aria-describedby="account-feedback" />
          </div>
          <div>
            <label for="account-email">Email address</label>
            <input id="account-email" v-model="email" type="email" autocomplete="username" maxlength="254" required :disabled="busy" aria-describedby="account-feedback" />
          </div>
          <div>
            <label for="account-password">Password</label>
            <input id="account-password" v-model="password" type="password" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
              maxlength="128" required :disabled="busy" :aria-describedby="mode === 'register' ? 'password-help account-feedback' : 'account-feedback'" />
            <p v-if="mode === 'register'" id="password-help" class="account-note">Use 8–128 characters.</p>
          </div>
          <div v-if="mode === 'register'">
            <label for="account-confirmation">Confirm password</label>
            <input id="account-confirmation" v-model="confirmation" type="password" autocomplete="new-password" maxlength="128" required :disabled="busy" aria-describedby="account-feedback" />
          </div>
          <button class="primary-button" type="submit" :disabled="busy || !authReady || Boolean(authError)">
            {{ busy ? 'Please wait…' : mode === 'register' ? 'Register' : 'Sign in to CycleWise' }}
          </button>
        </form>
      </template>

      <div id="account-feedback" ref="feedback" tabindex="-1">
        <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>
        <p v-if="notice" class="form-message" role="status">{{ notice }}</p>
      </div>
    </div>
  </section>
</template>
