<script setup>
import { nextTick, ref } from 'vue'
import { placeCategories } from '../../functions/data/places.js'
import { searchPlaces } from '../services/placeSearch.js'

const category = ref('All')
const suburb = ref('')
const places = ref([])
const busy = ref(false)
const searched = ref(false)
const error = ref('')
const feedback = ref(null)
const localMode = import.meta.env.DEV

function clearResults() {
  places.value = []
  searched.value = false
  error.value = ''
}

async function search() {
  if (busy.value) return
  clearResults()
  busy.value = true
  try {
    places.value = await searchPlaces(category.value, suburb.value)
    searched.value = true
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
  <section class="directory-section" aria-labelledby="place-search-title">
    <h2 id="place-search-title">Find a sample place</h2>
    <p>Query the directory function by category and suburb. These results are fictional, not confirmed services.</p>
    <p class="directory-note">{{ localMode ? 'Local development: uses the Firebase Functions emulator, not a deployed cloud service.' : 'Search requires a configured production function endpoint.' }}</p>
    <form class="place-search-form" :aria-busy="busy" @submit.prevent="search">
      <div><label for="place-search-category">Service category</label>
        <select id="place-search-category" v-model="category" :disabled="busy" @change="clearResults">
          <option v-for="item in placeCategories" :key="item">{{ item }}</option>
        </select></div>
      <div><label for="place-search-suburb">Suburb (optional)</label>
        <input id="place-search-suburb" v-model="suburb" type="search" maxlength="60" placeholder="e.g. Footscray" :disabled="busy" @input="clearResults" /></div>
      <button type="submit" class="primary-button" :disabled="busy">{{ busy ? 'Searching…' : 'Search places' }}</button>
    </form>
    <div ref="feedback" tabindex="-1" aria-live="polite">
      <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>
      <p v-if="searched" role="status">{{ places.length ? `${places.length} sample place(s) returned by the directory function.` : 'No sample places match. Try another category or suburb.' }}</p>
    </div>
    <ul v-if="places.length" class="place-results">
      <li v-for="place in places" :key="place.id"><h3>{{ place.name }}</h3>
        <p>{{ place.suburb }} · {{ place.category }} · {{ place.hours }}</p></li>
    </ul>
  </section>
</template>

<style scoped>
.place-search-form { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; margin: 16px 0; }
.place-search-form > div { flex: 1 1 200px; min-width: 0; }
label { display: block; margin-bottom: 6px; }
input, select { width: 100%; min-height: 44px; padding: 10px; border: 1px solid var(--line); border-radius: 6px; font: inherit; }
.place-results { padding-left: 24px; }
.place-results li { margin: 16px 0; overflow-wrap: anywhere; }
h3, .place-results p { margin: 6px 0; }
</style>
