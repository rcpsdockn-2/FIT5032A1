<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import AccountPanel from './components/AccountPanel.vue'
import AdminPanel from './components/AdminPanel.vue'
import GuideRating from './components/GuideRating.vue'
import { getCurrentUser, canAccessPage } from './services/auth.js'
import { getSavedItems, toggleSavedItem } from './services/savedItems.js'
import {
  eventItems,
  guideCategories,
  recyclingGuides,
  weeklyUpdates,
} from './data/cycleWiseData'

const searchTerm = ref('')
const currentPage = ref('learn')
const currentUser = ref(null)
const sessionError = ref('')
const savedMessage = ref('')
const selectedCategory = ref('All')
const searchError = ref('')
const searchNotice = ref('')
const savedGuideIds = ref([])
const savedEventIds = ref([])
const savedLoaded = ref(false)
const mainContent = ref(null)

const pageAllowed = computed(() => canAccessPage(currentPage.value, currentUser.value))
const savedGuides = computed(() => recyclingGuides.filter((guide) => savedGuideIds.value.includes(guide.id)))
const savedEvents = computed(() => eventItems.filter((event) => savedEventIds.value.includes(event.id)))

function updateSession() {
  sessionError.value = ''
  savedMessage.value = ''
  currentUser.value = null
  savedGuideIds.value = []
  savedEventIds.value = []
  savedLoaded.value = false
  try {
    currentUser.value = getCurrentUser()
    if (currentUser.value) {
      const items = getSavedItems()
      savedGuideIds.value = items.guides
      savedEventIds.value = items.events
      savedLoaded.value = true
    }
  } catch (issue) {
    sessionError.value = issue.message
  }
}

async function readPage(event) {
  // Small hash-based navigation supports refresh, direct links and browser Back.
  updateSession()
  if (window.location.hash === '#main-content') return
  currentPage.value = window.location.hash.replace('#/', '') || 'learn'
  if (event?.type === 'hashchange') {
    await nextTick()
    mainContent.value?.focus()
  }
}

function handleStorage(event) {
  if (!event.key || event.key === 'cyclewise-users' ||
    event.key === `cyclewise-saved-${currentUser.value?.id}`) updateSession()
}

function resetFilters() {
  searchTerm.value = ''
  selectedCategory.value = 'All'
  searchError.value = ''
  searchNotice.value = 'Showing all guides.'
}

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
  saveItem('guides', guideId)
}

function isEventSaved(eventId) {
  return savedEventIds.value.includes(eventId)
}

function toggleSavedEvent(eventId) {
  saveItem('events', eventId)
}

function saveItem(type, id) {
  savedMessage.value = ''
  if (!currentUser.value) {
    window.location.hash = '#/account'
    return
  }
  try {
    const items = toggleSavedItem(type, id)
    savedGuideIds.value = items.guides
    savedEventIds.value = items.events
    savedLoaded.value = true
    savedMessage.value = items[type].includes(id) ? 'Item saved to your account.' : 'Item removed from your saved list.'
  } catch (issue) {
    savedMessage.value = issue.message
  }
}

onMounted(() => {
  readPage()
  window.addEventListener('hashchange', readPage)
  window.addEventListener('storage', handleStorage)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', readPage)
  window.removeEventListener('storage', handleStorage)
})
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="mainContent?.focus()">Skip to main content</a>

  <div class="app-shell">
    <header class="site-header">
      <a class="brand" href="#/learn" aria-label="CycleWise home">
        <span class="brand-mark" aria-hidden="true">↻</span>
        <span>CycleWise</span>
      </a>

      <nav class="main-nav" aria-label="Main navigation">
        <a class="nav-link" href="#/learn" :class="{ 'nav-link--active': currentPage === 'learn' }"
          :aria-current="currentPage === 'learn' ? 'page' : undefined">
          Learn &amp; act
        </a>
        <a class="nav-link" href="#/account" :class="{ 'nav-link--active': currentPage === 'account' }"
          :aria-current="currentPage === 'account' ? 'page' : undefined">My account</a>
        <a v-if="currentUser" class="nav-link" href="#/saved" :class="{ 'nav-link--active': currentPage === 'saved' }"
          :aria-current="currentPage === 'saved' ? 'page' : undefined">My saved</a>
        <a v-if="currentUser?.role === 'admin'" class="nav-link" href="#/admin" :class="{ 'nav-link--active': currentPage === 'admin' }"
          :aria-current="currentPage === 'admin' ? 'page' : undefined">Admin</a>
      </nav>

      <span class="saved-summary" aria-live="polite">{{ !currentUser ? 'Guest' : savedLoaded ? `Saved: ${savedCount}` : 'Saved: unavailable' }}</span>
    </header>

    <main id="main-content" ref="mainContent" tabindex="-1">
      <p v-if="sessionError" class="session-message" role="alert">{{ sessionError }}</p>
      <p v-if="savedMessage" class="session-message" role="status">{{ savedMessage }}</p>
      <section v-if="!pageAllowed" class="page-content">
        <h1>Page unavailable</h1>
        <p v-if="currentPage === 'admin'">Only an administrator can view this page.</p>
        <p v-else-if="currentPage === 'saved'">Please sign in to view your saved items.</p>
        <p v-else>This page does not exist.</p>
        <a href="#/account">Go to my account</a>
      </section>
      <AccountPanel v-if="currentPage === 'account'" :current-user="currentUser" @session-change="updateSession" />
      <AdminPanel v-if="currentPage === 'admin' && pageAllowed" />
      <section v-if="currentPage === 'saved' && pageAllowed" class="page-content">
        <p class="eyebrow">{{ currentUser.name }} · My collection</p>
        <h1>My saved items</h1>
        <p>Your guides and events are saved separately from other accounts in this browser.</p>
        <p v-if="!savedLoaded">Your saved items could not be loaded. Existing data has not been removed.</p>
        <template v-else>
          <div v-if="!savedCount" class="empty-state">Nothing saved yet. <a href="#/learn">Explore the guides</a>.</div>
          <h2>Guides ({{ savedGuides.length }})</h2>
          <ul class="account-list">
            <li v-for="guide in savedGuides" :key="guide.id" class="guide-card">
              <div class="card-body">
                <h3>{{ guide.title }}</h3>
                <p>{{ guide.action }}</p>
                <button type="button" class="secondary-button" :aria-label="`Remove ${guide.title}`" @click="toggleSavedGuide(guide.id)">Remove</button>
              </div>
            </li>
          </ul>
          <h2>Events ({{ savedEvents.length }})</h2>
          <ul class="account-list">
            <li v-for="event in savedEvents" :key="event.id" class="guide-card">
              <div class="card-body">
                <h3>{{ event.title }}</h3>
                <p>{{ event.location }} · {{ event.date }}</p>
                <button type="button" class="secondary-button" :aria-label="`Remove ${event.title}`" @click="toggleSavedEvent(event.id)">Remove</button>
              </div>
            </li>
          </ul>
        </template>
      </section>
      <section v-show="currentPage === 'learn'" class="page-content">
        <div class="page-heading">
          <div>
            <p class="eyebrow">Melbourne circular economy guide</p>
            <h1>Learn &amp; act</h1>
            <p class="page-summary">
              Find a clear next step for everyday items, then discover local ways to repair,
              reuse and participate.
            </p>
          </div>

          <aside class="heading-note" aria-label="About the sample data">
            <span class="heading-note__number">01</span>
            <div>
              <strong>Start with one item</strong>
              <p>Explore sample guides, save useful items and share your rating.</p>
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
                maxlength="100"
                @input="searchError = ''; searchNotice = ''"
                :aria-invalid="Boolean(searchError)"
                :aria-describedby="searchError ? 'search-error' : searchNotice ? 'search-note' : undefined"
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
              :aria-pressed="selectedCategory === category"
              type="button"
              @click="selectCategory(category)"
            >
              {{ category }}
            </button>
          </div>
          <button v-if="searchTerm || selectedCategory !== 'All'" type="button" class="text-button" @click="resetFilters">Reset filters</button>
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
                      {{ !currentUser ? 'Sign in to save' : isGuideSaved(guide.id) ? 'Saved' : 'Save guide' }}
                    </button>
                  </div>
                  <GuideRating :guide-id="guide.id" :current-user="currentUser" />
                </div>
              </article>

              <div v-if="!filteredGuides.length" class="empty-state" role="status">
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
                    {{ !currentUser ? 'Sign in to save' : isEventSaved(event.id) ? 'Saved' : 'Save place' }}
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
      <span>CycleWise Melbourne · Learn, save and rate</span>
      <span>Sample data · Accounts and ratings stay in this browser</span>
    </footer>
  </div>
</template>
