import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
function colour(name) { return css.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))[1] }
function luminance(hex) {
  const values = hex.slice(1).match(/../g).map((part) => {
    const value = parseInt(part, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
}
function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

test('normal-size text in the shared palette meets 4.5:1 contrast', () => {
  for (const [text, background] of [
    ['white', 'blue'], ['white', 'green'], ['ink', 'white'], ['muted', 'white'],
    ['muted', 'blue-pale'], ['blue-dark', 'blue-soft'], ['gold', 'white'],
  ]) assert.ok(contrast(colour(text), colour(background)) >= 4.5, `${text} on ${background}`)
})
test('form borders and focus colour meet 3:1 against their adjacent surfaces', () => {
  for (const background of ['white', 'blue-pale']) {
    assert.ok(contrast(colour('line'), colour(background)) >= 3)
    assert.ok(contrast(colour('navy'), colour(background)) >= 3)
  }
})

test('navigation, placeholder, feedback and numbered labels retain text contrast', () => {
  for (const [text, background] of [
    ['#d9e7ef', colour('navy')], ['#526673', colour('white')],
    ['#9b4c27', colour('white')], [colour('green'), colour('blue-pale')],
    [colour('blue-dark'), '#d7e9f5'],
  ]) assert.ok(contrast(text, background) >= 4.5, `${text} on ${background}`)
})

test('map names remain in persistent text instead of hover-only tooltips', () => {
  const map = readFileSync(new URL('../src/components/PlaceMap.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(map, /bindTooltip/)
  assert.match(map, /Show \{\{ place.name \}\} on map/)
  assert.match(map, /route\.steps/)
})
