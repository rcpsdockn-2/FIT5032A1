<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getGuideRating, rateGuide } from '../services/ratings.js'

const props = defineProps({ guideId: String, currentUser: Object })
const summary = ref(null)
const score = ref('')
const message = ref('')
const error = ref('')
const scoreInput = ref(null)

function clearFeedback() {
  message.value = ''
  error.value = ''
}

function handleStorage(event) {
  // Unrelated saves in another tab must not discard the chosen score.
  if (!event.key || event.key === 'cyclewise-ratings') refresh()
}

function refresh() {
  message.value = ''
  error.value = ''
  summary.value = null
  score.value = ''
  try {
    summary.value = getGuideRating(props.guideId, props.currentUser?.id)
    score.value = summary.value.ownScore
  } catch (issue) {
    error.value = issue.message
  }
}

function submit() {
  message.value = ''
  error.value = ''
  try {
    rateGuide(props.guideId, Number(score.value))
    refresh()
    if (!error.value) message.value = 'Your rating has been saved.'
  } catch (issue) {
    error.value = issue.message
    scoreInput.value?.focus()
  }
}

watch(() => props.currentUser?.id, refresh)
onMounted(() => {
  refresh()
  window.addEventListener('storage', handleStorage)
})
onUnmounted(() => window.removeEventListener('storage', handleStorage))
</script>

<template>
  <section class="guide-rating" :aria-label="`Rating for ${guideId}`">
    <p v-if="summary" aria-live="polite">
      <strong>{{ summary.count ? `${summary.average} / 5` : 'No ratings yet' }}</strong>
      · {{ summary.count }} rating{{ summary.count === 1 ? '' : 's' }}
    </p>
    <form v-if="currentUser" novalidate @submit.prevent="submit">
      <label :for="`rating-${guideId}`">Your rating (1–5)</label>
      <div class="rating-controls">
        <select :id="`rating-${guideId}`" ref="scoreInput" v-model="score" @change="clearFeedback" :aria-invalid="Boolean(error)"
          :aria-describedby="error ? `rating-error-${guideId}` : undefined">
          <option value="">Select a score</option>
          <option v-for="value in 5" :key="value" :value="value">{{ value }}</option>
        </select>
        <button class="secondary-button" type="submit">{{ summary?.ownScore ? 'Update rating' : 'Submit rating' }}</button>
      </div>
      <p class="card-note">One rating per account. You can change it later.</p>
    </form>
    <p v-else><a href="#/account">Sign in to rate this guide</a></p>
    <p v-if="error" :id="`rating-error-${guideId}`" class="form-message form-message--error" role="alert">{{ error }}</p>
    <p v-if="message" class="form-message" role="status">{{ message }}</p>
    <p class="card-note">Ratings are shared only within this browser, not across devices.</p>
  </section>
</template>
