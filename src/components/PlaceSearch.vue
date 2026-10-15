<script setup>
import { nextTick, ref } from 'vue'
import { placeCategories } from '../../functions/data/places.js'
import { searchPlaces } from '../services/placeSearch.js'
import PlaceMap from './PlaceMap.vue'

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
    <p v-if="localMode" class="directory-note">Local development: uses the Firebase Functions emulator.</p>
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
    <PlaceMap v-if="searched && places.length" :places="places" />
  </section>
</template>

<style scoped>
.place-search-form { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; margin: 16px 0; }
.place-search-form > div { flex: 1 1 200px; min-width: 0; }
label { display: block; margin-bottom: 6px; }
input, select { width: 100%; min-height: 44px; padding: 10px; border: 1px solid var(--line); border-radius: 6px; font: inherit; }
</style>
