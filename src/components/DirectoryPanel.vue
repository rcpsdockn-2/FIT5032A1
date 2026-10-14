<script setup>
import { recyclingPlaces, communityEvents } from '../data/directoryData.js'
</script>

<template>
  <section class="page-content">
    <p class="eyebrow">Explore your community</p>
    <h1>Places &amp; events</h1>
    <p>Browse recycling services and community activities in one place.</p>
    <p class="directory-note">Demo directory: all names, opening hours and events below are fictional. These are not confirmed services or bookings.</p>

    <section class="directory-section" aria-labelledby="places-title">
      <h2 id="places-title">Recycling places</h2>
      <div class="table-scroll" tabindex="0" role="region" aria-label="Recycling places table">
        <table class="directory-table">
          <caption>{{ recyclingPlaces.length }} sample places</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Suburb</th>
              <th scope="col">Category</th>
              <th scope="col">Opening hours</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="place in recyclingPlaces" :key="place.id">
              <th scope="row">{{ place.name }}</th>
              <td>{{ place.suburb }}</td>
              <td>{{ place.category }}</td>
              <td>{{ place.hours }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="directory-section" aria-labelledby="events-title">
      <h2 id="events-title">Community events</h2>
      <div class="table-scroll" tabindex="0" role="region" aria-label="Community events table">
        <table class="directory-table">
          <caption>{{ communityEvents.length }} sample events</caption>
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Suburb</th>
              <th scope="col">Type</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in communityEvents" :key="event.id">
              <th scope="row">{{ event.title }}</th>
              <td>{{ event.suburb }}</td>
              <td>{{ event.type }}</td>
              <td>{{ event.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
