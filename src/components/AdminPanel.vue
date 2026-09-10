<script setup>
import { onMounted, ref } from 'vue'
import { listAccounts } from '../services/auth.js'

const accounts = ref([])
const error = ref('')
onMounted(() => {
  try {
    accounts.value = listAccounts()
  } catch (issue) {
    error.value = issue.message
  }
})
</script>

<template>
  <section class="page-content" aria-labelledby="admin-title">
    <p class="eyebrow">Administrator</p>
    <h1 id="admin-title">Local accounts</h1>
    <p>View accounts registered in this browser. Passwords are not displayed.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <template v-else>
      <p>{{ accounts.length }} accounts, including the demo administrator.</p>
      <ul class="account-list">
        <li v-for="account in accounts" :key="account.id" class="guide-card">
          <div>
            <h2>{{ account.name }}</h2>
            <p>{{ account.email }}</p>
            <span class="tag">{{ account.role === 'admin' ? 'Admin' : 'Member' }}</span>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>
