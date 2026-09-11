import { requireUser } from './auth.js'
import { recyclingGuides } from '../data/cycleWiseData.js'

const ratingsKey = 'cyclewise-ratings'

// Validate storage before using it. This is still a local demo, not trusted server data.

function readRatings() {
  try {
    const ratings = JSON.parse(localStorage.getItem(ratingsKey) || '[]')
    if (!Array.isArray(ratings) || !ratings.every((rating) =>
      rating && typeof rating.userId === 'string' &&
      recyclingGuides.some((guide) => guide.id === rating.guideId) &&
      Number.isInteger(rating.score) && rating.score >= 1 && rating.score <= 5)) {
      throw new Error('Invalid ratings')
    }
    const pairs = ratings.map((rating) => JSON.stringify([rating.userId, rating.guideId]))
    if (new Set(pairs).size !== pairs.length) throw new Error('Duplicate ratings')
    return ratings
  } catch {
    throw new Error('Cannot read local ratings. Check browser storage and rating data.')
  }
}

export function getGuideRating(guideId, userId) {
  const ratings = readRatings().filter((rating) => rating.guideId === guideId)
  const total = ratings.reduce((sum, rating) => sum + rating.score, 0)
  return {
    count: ratings.length,
    average: ratings.length ? (total / ratings.length).toFixed(1) : null,
    ownScore: ratings.find((rating) => rating.userId === userId)?.score || '',
  }
}

export function rateGuide(guideId, score) {
  const user = requireUser()
  if (!recyclingGuides.some((guide) => guide.id === guideId)) throw new Error('Guide not found.')
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error('Please select a whole number from 1 to 5.')
  }
  const ratings = readRatings()
  const existing = ratings.find((rating) => rating.userId === user.id && rating.guideId === guideId)
  if (existing) existing.score = score
  else ratings.push({ userId: user.id, guideId, score })
  try {
    localStorage.setItem(ratingsKey, JSON.stringify(ratings))
  } catch {
    throw new Error('Could not save your rating. Check browser storage and try again.')
  }
}
