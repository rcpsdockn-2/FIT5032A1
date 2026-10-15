<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { routeOrigins } from '../data/mapData.js'
import { getDrivingRoute } from '../services/mapRoutes.js'

const props = defineProps({ places: { type: Array, required: true } })
const canvas = ref(null)
const selectedId = ref('')
const originId = ref('')
const route = ref(null)
const busy = ref(false)
const error = ref('')
const tileError = ref(false)
const feedback = ref(null)
const selected = computed(() => props.places.find((place) => place.id === selectedId.value))
let map, markerLayer, routeLayer, observer, controller
let lastRequest = 0

function clearRoute() {
  route.value = null
  error.value = ''
  routeLayer?.clearLayers()
}

function selectPlace(place) {
  if (busy.value) return
  selectedId.value = place.id
  clearRoute()
  drawMarkers()
  map.setView([place.lat, place.lng], 13)
}

function drawMarkers() {
  markerLayer.clearLayers()
  for (const place of props.places) {
    const label = document.createElement('span')
    label.textContent = `${place.name} (sample)`
    L.circleMarker([place.lat, place.lng], { radius: selectedId.value === place.id ? 12 : 8,
      color: selectedId.value === place.id ? '#8a4e00' : '#235d8d', fillOpacity: 0.85 })
      .bindTooltip(label).on('click', () => selectPlace(place)).addTo(markerLayer)
  }
}

async function findRoute() {
  if (busy.value) return
  clearRoute()
  const origin = routeOrigins.find((item) => item.id === originId.value)
  if (!selected.value || !origin) {
    error.value = 'Select a sample destination and a starting suburb first.'
    await nextTick()
    feedback.value?.focus()
    return
  }
  if (Date.now() - lastRequest < 2000) {
    error.value = 'Please wait two seconds before requesting another route.'
    return
  }
  lastRequest = Date.now()
  busy.value = true
  controller = new AbortController()
  try {
    const result = await getDrivingRoute(origin, selected.value, { signal: controller.signal })
    if (controller.signal.aborted) return
    route.value = result
    const line = L.polyline(result.line, { color: '#7b3fb2', weight: 5 }).addTo(routeLayer)
    const label = document.createElement('span')
    label.textContent = `Start: ${origin.name}`
    L.circleMarker([origin.lat, origin.lng], { radius: 9, color: '#236d43', fillOpacity: 1 }).bindTooltip(label).addTo(routeLayer)
    map.fitBounds(line.getBounds(), { padding: [28, 28] })
  } catch (issue) {
    if (!controller.signal.aborted) error.value = issue.message
  } finally {
    busy.value = false
    await nextTick()
    feedback.value?.focus()
  }
}

onMounted(() => {
  map = L.map(canvas.value, { scrollWheelZoom: false }).setView([-37.81, 144.96], 11)
  markerLayer = L.layerGroup().addTo(map)
  routeLayer = L.layerGroup().addTo(map)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).on('tileerror', () => { tileError.value = true }).addTo(map)
  drawMarkers()
  map.fitBounds(props.places.map((place) => [place.lat, place.lng]), { padding: [28, 28], maxZoom: 13 })
  observer = new ResizeObserver(() => map?.invalidateSize({ pan: false }))
  observer.observe(canvas.value)
})

onUnmounted(() => {
  controller?.abort()
  observer?.disconnect()
  map?.remove()
})
</script>

<template>
  <section class="map-panel" aria-labelledby="sample-map-title">
    <h3 id="sample-map-title">Sample place map &amp; directions</h3>
    <p>Markers use approximate suburb centres, not real recycling facilities. Routes are driving demonstrations only, not live navigation.</p>
    <p>OpenStreetMap loads map tiles; OSRM/FOSSGIS receives the selected public start and destination to calculate the route. No GPS location or account details are sent.</p>
    <p id="map-help">Keyboard: Tab to the map and use arrow keys to pan, or use the place buttons below instead. All destinations and directions are also available as text.</p>
    <div ref="canvas" class="map-canvas" role="region" aria-label="Interactive sample place map" aria-describedby="map-help"></div>
    <p v-if="tileError" class="form-message form-message--error" role="alert">Some map tiles could not load. You can still select a place from the list below.</p>
    <p class="map-credit">Routes: <a href="https://project-osrm.org/" target="_blank" rel="noreferrer">OSRM</a> / <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noreferrer">FOSSGIS</a>, using OpenStreetMap data. <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Report a map issue</a>.</p>
    <ul class="map-place-list">
      <li v-for="place in places" :key="place.id">
        <button type="button" class="secondary-button" :disabled="busy" :aria-pressed="selectedId === place.id" @click="selectPlace(place)">Show {{ place.name }} on map</button>
        <p>{{ place.suburb }} · {{ place.category }} · {{ place.hours }}</p>
      </li>
    </ul>
    <div class="route-controls">
      <label for="route-origin">Starting suburb centre</label>
      <select id="route-origin" v-model="originId" :disabled="busy" @change="clearRoute">
        <option value="">Choose a start</option>
        <option v-for="item in routeOrigins" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      <p role="status">Destination: {{ selected ? `${selected.name} (${selected.suburb}, sample)` : 'Choose a place above or click a map marker.' }}</p>
      <button type="button" class="primary-button" :disabled="busy" @click="findRoute">{{ busy ? 'Finding route…' : 'Get driving directions' }}</button>
    </div>
    <div ref="feedback" tabindex="-1">
      <p v-if="error" class="form-message form-message--error" role="alert">{{ error }}</p>
      <template v-if="route">
        <p role="status">Driving route: {{ (route.distance / 1000).toFixed(1) }} km · about {{ Math.max(1, Math.round(route.duration / 60)) }} min. Estimates only; no live traffic.</p>
        <p>Purple line: road route. Green point: start. Selected larger point: destination.</p>
        <ol class="route-steps"><li v-for="(step, index) in route.steps" :key="index">{{ step.instruction }} ({{ step.distance }} m)</li></ol>
      </template>
    </div>
  </section>
</template>

<style scoped>
.map-panel { margin: 24px 0; }
.map-canvas { height: 360px; width: 100%; border: 1px solid var(--line); border-radius: 6px; z-index: 0; }
.map-place-list { list-style: none; padding: 0; }
.map-place-list li { margin: 16px 0; }
.map-place-list p { margin: 8px 0; overflow-wrap: anywhere; }
.map-place-list button { text-align: left; white-space: normal; }
.route-controls label { display: block; margin-bottom: 6px; }
.route-controls select { width: 100%; min-height: 44px; padding: 10px; border: 1px solid var(--line); border-radius: 6px; font: inherit; margin-bottom: 12px; }
.route-steps li { margin-bottom: 10px; overflow-wrap: anywhere; }
.map-credit { font-size: 0.85rem; margin: 12px 0; }
.map-canvas :deep(.leaflet-control-attribution) { max-width: 100%; white-space: normal; }
.map-canvas :deep(.leaflet-control-attribution) { color: #17344b; background: white; }
.map-canvas :deep(.leaflet-control-attribution a) { color: #235d8d; }
.map-canvas :deep(.leaflet-control-zoom a) { width: 44px; height: 44px; line-height: 44px; }
@media (max-width: 620px) { .map-canvas { height: 300px; } }
</style>
