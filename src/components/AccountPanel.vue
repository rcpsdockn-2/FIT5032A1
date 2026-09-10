<script setup>
import { ref } from 'vue'
import { register, signIn, signOut } from '../services/auth'

defineProps({ currentUser: { type: Object, default: null } })
const emit = defineEmits(['session-change'])

const mode = ref('signin')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmation = ref('')
const error = ref('')
const notice = ref('')
const busy = ref(false)

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
      notice.value = 'Account created. Please sign in with your email and password.'
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
  }
}

function logout() {
  try {
    signOut()
    emit('session-change')
    changeMode('signin')
    notice.value = 'You have signed out.'
  } catch {
    error.value = 'Could not sign out. Please check browser storage and try again.'
  }
}

</script>

<template>
  <section class="page-content" aria-labelledby="account-title">
    <div class="account-panel">
      <p class="eyebrow">CycleWise community</p>
      <h1 id="account-title">My account</h1>
      <p class="account-note">Local demo accounts work only in this browser. Use a test email and a password you do not use elsewhere.</p>

      <div v-if="currentUser" class="account-details">
        <h2>Welcome, {{ currentUser.name }}</h2>
        <p>{{ currentUser.email }}</p>
        <p>Role: {{ currentUser.role === 'admin' ? 'Admin' : 'Member' }}</p>
        <p><a href="#/saved">View my saved items</a></p>
        <p v-if="currentUser.role === 'admin'"><a href="#/admin">Open admin page</a></p>
        <button class="primary-button" type="button" @click="logout">Sign out</button>
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
            <input id="account-name" v-model="name" autocomplete="name" maxlength="50" required :disabled="busy" />
          </div>
          <div>
            <label for="account-email">Email address</label>
            <input id="account-email" v-model="email" type="email" autocomplete="username" maxlength="254" required :disabled="busy" />
          </div>
          <div>
            <label for="account-password">Password</label>
            <input id="account-password" v-model="password" type="password" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
              maxlength="128" required :disabled="busy" :aria-describedby="mode === 'register' ? 'password-help' : undefined" />
            <p v-if="mode === 'register'" id="password-help" class="account-note">Use 8–128 characters.</p>
          </div>
          <div v-if="mode === 'register'">
            <label for="account-confirmation">Confirm password</label>
            <input id="account-confirmation" v-model="confirmation" type="password" autocomplete="new-password" maxlength="128" required :disabled="busy" />
          </div>
          <button class="primary-button" type="submit" :disabled="busy">
            {{ busy ? 'Please wait…' : mode === 'register' ? 'Register' : 'Sign in to CycleWise' }}
          </button>
        </form>
      </template>

      <details class="account-note">
        <summary>Administrator demo account</summary>
        <p>Email: admin@cyclewise.example<br />Password: CycleWiseDemo123!</p>
        <p>This shared account is for local coursework demonstrations only.</p>
      </details>

      <div id="account-feedback">
        <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>
        <p v-if="notice" class="form-message" role="status">{{ notice }}</p>
      </div>
    </div>
  </section>
</template>
