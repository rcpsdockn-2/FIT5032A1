<script setup>
import { recyclingPlaces, communityEvents } from '../data/directoryData.js'
import DirectoryTable from './DirectoryTable.vue'
import PlaceSearch from './PlaceSearch.vue'

const placeColumns = [
  { key: 'name', label: 'Name' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'category', label: 'Category' },
  { key: 'hours', label: 'Opening hours' },
]
const eventColumns = [
  { key: 'title', label: 'Event' },
  { key: 'suburb', label: 'Suburb' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Date' },
]
</script>

<template>
  <section class="page-content">
    <p class="eyebrow">Explore your community</p>
    <h1>Places &amp; events</h1>
    <p>Browse recycling services and community activities in one place.</p>
    <p class="directory-note">Demo directory: all names, opening hours and events below are fictional. These are not confirmed services or bookings.</p>

    <PlaceSearch />
    <DirectoryTable table-id="places" title="Recycling places" :rows="recyclingPlaces" :columns="placeColumns" />
    <DirectoryTable table-id="events" title="Community events" :rows="communityEvents" :columns="eventColumns" />
  </section>
</template>
