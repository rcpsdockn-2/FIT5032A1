<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  eventItems,
  guideCategories,
  recyclingGuides,
  weeklyUpdates,
} from './data/cycleWiseData'

const searchTerm = ref('')
const selectedCategory = ref('All')
const searchError = ref('')
const searchNotice = ref('')
const savedGuideIds = ref([])
const savedEventIds = ref([])

const savedGuidesStorageKey = 'cyclewise-saved-guides'
const savedEventsStorageKey = 'cyclewise-saved-events'

const filteredGuides = computed(() => {
  const search = searchTerm.value.trim().toLowerCase()

  return recyclingGuides.filter((guide) => {
    const matchesCategory =
      selectedCategory.value === 'All' || guide.category === selectedCategory.value
    const searchableText = [
      guide.title,
      guide.summary,
      guide.category,
      ...guide.keywords,
    ]
      .join(' ')
      .toLowerCase()

    return matchesCategory && (!search || searchableText.includes(search))
  })
})

const savedCount = computed(() => savedGuideIds.value.length + savedEventIds.value.length)

function handleSearch() {
  searchError.value = ''
  searchNotice.value = ''

  const search = searchTerm.value.trim()

  if (!search) {
    searchError.value = 'Please enter an item, such as batteries or glass.'
    return
  }

  if (search.length < 2) {
    searchError.value = 'Please enter at least 2 characters to search.'
    return
  }

  if (!filteredGuides.value.length) {
    searchError.value = 'We could not find a guide for that item yet. Try another keyword.'
    return
  }

  searchNotice.value = `${filteredGuides.value.length} guide${
    filteredGuides.value.length === 1 ? '' : 's'
  } found. Check the action before you sort or drop anything off.`
}

function selectCategory(category) {
  selectedCategory.value = category
  searchError.value = ''
  searchNotice.value = category === 'All' ? '' : `Showing ${category.toLowerCase()} guides.`
}

function isGuideSaved(guideId) {
  return savedGuideIds.value.includes(guideId)
}

function toggleSavedGuide(guideId) {
  if (isGuideSaved(guideId)) {
    savedGuideIds.value = savedGuideIds.value.filter((id) => id !== guideId)
  } else {
    savedGuideIds.value = [...savedGuideIds.value, guideId]
  }

  localStorage.setItem(savedGuidesStorageKey, JSON.stringify(savedGuideIds.value))
}

function isEventSaved(eventId) {
  return savedEventIds.value.includes(eventId)
}

function toggleSavedEvent(eventId) {
  if (isEventSaved(eventId)) {
    savedEventIds.value = savedEventIds.value.filter((id) => id !== eventId)
  } else {
    savedEventIds.value = [...savedEventIds.value, eventId]
  }

  localStorage.setItem(savedEventsStorageKey, JSON.stringify(savedEventIds.value))
}

onMounted(() => {
  const storedGuideIds = localStorage.getItem(savedGuidesStorageKey)

  if (storedGuideIds) {
    savedGuideIds.value = JSON.parse(storedGuideIds)
  }

  const storedEventIds = localStorage.getItem(savedEventsStorageKey)

  if (storedEventIds) {
    savedEventIds.value = JSON.parse(storedEventIds)
  }
})
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>

  <div class="app-shell">
    <header class="site-header">
      <a class="brand" href="#main-content" aria-label="CycleWise home">
        <span class="brand-mark" aria-hidden="true">↻</span>
        <span>CycleWise</span>
      </a>

      <nav class="main-nav" aria-label="Main navigation">
        <span class="nav-link nav-link--active">Learn &amp; act</span>
      </nav>

      <span class="saved-summary" aria-live="polite">Saved: {{ savedCount }}</span>
      <span class="prototype-label">Prototype · Round 3</span>
    </header>

    <main id="main-content">
      <section class="page-content">
        <div class="page-heading">
          <div>
            <p class="eyebrow">Melbourne circular economy guide</p>
            <h1>Learn &amp; act</h1>
            <p class="page-summary">
              Find a clear next step for everyday items, then discover local ways to repair,
              reuse and participate.
            </p>
          </div>

          <aside class="heading-note" aria-label="Current prototype scope">
            <span class="heading-note__number">01</span>
            <div>
              <strong>Start with one item</strong>
              <p>This first version uses local sample data so the interface can grow safely.</p>
            </div>
          </aside>
        </div>

        <section class="search-panel" aria-labelledby="search-title">
          <div class="section-heading">
            <span class="section-number">1</span>
            <div>
              <p class="eyebrow">Quick guide</p>
              <h2 id="search-title">What are you trying to recycle?</h2>
            </div>
          </div>

          <form class="search-form" novalidate @submit.prevent="handleSearch">
            <label for="item-search">Search for an item</label>
            <div class="search-row">
              <input
                id="item-search"
                v-model="searchTerm"
                type="search"
                placeholder="batteries, glass, e-waste..."
                autocomplete="off"
                :aria-invalid="Boolean(searchError)"
                :aria-describedby="searchError ? 'search-error' : 'search-note'"
              />
              <button class="primary-button" type="submit">Find my guide</button>
            </div>
            <p v-if="searchError" id="search-error" class="form-message form-message--error" role="alert">
              {{ searchError }}
            </p>
            <p v-else-if="searchNotice" id="search-note" class="form-message" aria-live="polite">
              {{ searchNotice }}
            </p>
          </form>

          <div class="category-picker" role="group" aria-label="Filter guides by category">
            <button
              v-for="category in guideCategories"
              :key="category"
              class="category-button"
              :class="{ 'category-button--selected': selectedCategory === category }"
              type="button"
              @click="selectCategory(category)"
            >
              {{ category }}
            </button>
          </div>
        </section>

        <div class="content-grid">
          <section aria-labelledby="guides-title">
            <div class="section-heading section-heading--compact">
              <span class="section-number">2</span>
              <div>
                <p class="eyebrow">Dynamic guide cards</p>
                <h2 id="guides-title">Where does this go?</h2>
              </div>
            </div>

            <div class="card-stack">
              <article v-for="guide in filteredGuides" :key="guide.id" class="guide-card">
                <div class="card-body">
                  <div class="card-meta">
                    <span class="tag">{{ guide.category }}</span>
                    <span>{{ guide.updated }}</span>
                  </div>
                  <h3>{{ guide.title }}</h3>
                  <p>{{ guide.summary }}</p>
                  <p class="guide-action"><strong>Next step:</strong> {{ guide.action }}</p>
                  <div class="card-actions">
                    <span class="card-note">{{ guide.note }}</span>
                    <button
                      class="secondary-button"
                      type="button"
                      :aria-pressed="isGuideSaved(guide.id)"
                      @click="toggleSavedGuide(guide.id)"
                    >
                      {{ isGuideSaved(guide.id) ? 'Saved' : 'Save guide' }}
                    </button>
                  </div>
                </div>
              </article>

              <div v-if="!filteredGuides.length" class="empty-state">
                <strong>No guide matches this filter yet.</strong>
                <p>Try “battery”, “glass” or “charger”, or return to all guides.</p>
              </div>
            </div>
          </section>

          <aside aria-labelledby="feed-title">
            <div class="section-heading section-heading--compact">
              <span class="section-number">3</span>
              <div>
                <p class="eyebrow">Local feed</p>
                <h2 id="feed-title">Nearby events</h2>
              </div>
            </div>

            <div class="feed-list">
              <article v-for="event in eventItems" :key="event.id" class="feed-card">
                <div class="feed-card__topline">
                  <span class="tag tag--green">{{ event.type }}</span>
                  <span>{{ event.date }}</span>
                </div>
                <h3>{{ event.title }}</h3>
                <p>{{ event.description }}</p>
                <div class="feed-card__footer">
                  <span>{{ event.location }}</span>
                  <button
                    class="text-button"
                    type="button"
                    :aria-pressed="isEventSaved(event.id)"
                    @click="toggleSavedEvent(event.id)"
                  >
                    {{ isEventSaved(event.id) ? 'Saved' : 'Save place' }}
                  </button>
                </div>
              </article>
            </div>
          </aside>
        </div>

        <section class="updates-panel" aria-labelledby="updates-title">
          <div class="section-heading section-heading--compact">
            <span class="section-number">4</span>
            <div>
              <p class="eyebrow">Keep checking local rules</p>
              <h2 id="updates-title">Council updates</h2>
            </div>
          </div>

          <div class="update-list">
            <article v-for="update in weeklyUpdates" :key="update.id" class="update-item">
              <span class="update-item__icon" aria-hidden="true">✓</span>
              <div>
                <h3>{{ update.title }}</h3>
                <p>{{ update.description }}</p>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>

    <footer class="site-footer">
      <span>CycleWise Melbourne · early application skeleton</span>
      <span>Built in rounds, with local sample data</span>
    </footer>
  </div>
</template>
