<script setup>
import { computed, ref } from 'vue'
import { filterAndSortRows, paginateRows } from '../services/tableData.js'

const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  title: { type: String, required: true },
  tableId: { type: String, required: true },
})

function emptyFilters() {
  const values = {}
  for (const column of props.columns) values[column.key] = ''
  return values
}

const filters = ref(emptyFilters())
const sortKey = ref('')
const sortDirection = ref('ascending')
const page = ref(1)
const matchingRows = computed(() => filterAndSortRows(
  props.rows, filters.value, sortKey.value, sortDirection.value,
))
const pageData = computed(() => paginateRows(matchingRows.value, page.value))

function sortBy(key) {
  sortDirection.value = sortKey.value === key && sortDirection.value === 'ascending'
    ? 'descending' : 'ascending'
  sortKey.value = key
  page.value = 1
}

function resetTable() {
  filters.value = emptyFilters()
  sortKey.value = ''
  sortDirection.value = 'ascending'
  page.value = 1
}
</script>

<template>
  <section class="directory-section" :aria-labelledby="`${tableId}-title`">
    <h2 :id="`${tableId}-title`">{{ title }}</h2>
    <div class="table-filters">
      <div v-for="column in columns" :key="column.key">
        <label :for="`${tableId}-filter-${column.key}`">{{ title }}: {{ column.label }}</label>
        <input :id="`${tableId}-filter-${column.key}`" v-model="filters[column.key]"
          type="search" maxlength="100" :placeholder="`Search ${column.label.toLowerCase()}`"
          @input="page = 1" />
      </div>
    </div>
    <button type="button" class="secondary-button" @click="resetTable">Reset {{ title.toLowerCase() }}</button>
    <div class="table-scroll" tabindex="0" role="region" :aria-label="`${title} table`">
      <table class="directory-table">
        <caption>{{ pageData.total }} of {{ rows.length }} sample entries · 10 rows per page</caption>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" scope="col"
              :aria-sort="sortKey === column.key ? sortDirection : 'none'">
              <button type="button" class="table-sort" @click="sortBy(column.key)"
                :aria-label="`Sort ${title.toLowerCase()} by ${column.label.toLowerCase()}`">
                {{ column.label }}
                <span aria-hidden="true">{{ sortKey === column.key ? (sortDirection === 'ascending' ? '↑' : '↓') : '↕' }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pageData.rows" :key="row.id">
            <template v-for="(column, index) in columns" :key="column.key">
              <th v-if="index === 0" scope="row">{{ row[column.key] }}</th>
              <td v-else>{{ row[column.key] }}</td>
            </template>
          </tr>
          <tr v-if="!pageData.total">
            <td :colspan="columns.length">No entries match these filters. Try another search or reset the table.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <nav class="table-pagination" :aria-label="`${title} pagination`">
      <button type="button" class="secondary-button" :disabled="pageData.page === 1"
        :aria-label="`Previous ${title.toLowerCase()} page`" @click="page = pageData.page - 1">Previous</button>
      <span role="status">Page {{ pageData.page }} of {{ pageData.totalPages }} · {{ pageData.total }} results</span>
      <button type="button" class="secondary-button" :disabled="pageData.page === pageData.totalPages"
        :aria-label="`Next ${title.toLowerCase()} page`" @click="page = pageData.page + 1">Next</button>
    </nav>
  </section>
</template>

<style scoped>
.table-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.table-filters label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
}
.table-filters input {
  width: 100%;
  min-height: 44px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
}
.table-sort {
  padding: 0;
  text-align: left;
  color: var(--navy);
  background: transparent;
  border: 0;
  font-weight: 700;
}
.table-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  font-size: 0.85rem;
}
.table-pagination button:disabled {
  cursor: default;
}
@media (max-width: 620px) {
  .table-filters { grid-template-columns: 1fr; }
  .table-pagination { justify-content: center; }
}
</style>
