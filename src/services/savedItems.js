import { requireUser } from './auth.js'
import { recyclingGuides, eventItems } from '../data/cycleWiseData.js'

function readItems(userId) {
  try {
    const items = JSON.parse(localStorage.getItem(`cyclewise-saved-${userId}`) || '{"guides":[],"events":[]}')
    if (!Array.isArray(items.guides) || !Array.isArray(items.events)) throw new Error('Invalid saved items')
    return {
      guides: [...new Set(items.guides.filter((id) => recyclingGuides.some((guide) => guide.id === id)))],
      events: [...new Set(items.events.filter((id) => eventItems.some((event) => event.id === id)))],
    }
  } catch {
    throw new Error('Cannot read your saved items. Check browser storage and try again.')
  }
}

export function getSavedItems() {
  return readItems(requireUser().id)
}

export function toggleSavedItem(type, id) {
  const user = requireUser()
  const data = type === 'guides' ? recyclingGuides : type === 'events' ? eventItems : []
  if (!data.some((item) => item.id === id)) throw new Error('This item is not available.')
  const items = readItems(user.id)
  items[type] = items[type].includes(id)
    ? items[type].filter((savedId) => savedId !== id)
    : [...items[type], id]
  try {
    localStorage.setItem(`cyclewise-saved-${user.id}`, JSON.stringify(items))
  } catch {
    throw new Error('Could not save this change. Check browser storage and try again.')
  }
  return items
}
