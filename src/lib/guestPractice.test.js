import { describe, expect, it } from 'vitest'
import { guestLaunchUrl, isGuestMode, learningHubUrl } from './guestPractice.js'

describe('guest practice navigation', () => {
  it('marks internal practice links as guest mode', () => {
    expect(guestLaunchUrl('?game=periodic-table')).toBe('?game=periodic-table&guest=1')
    expect(guestLaunchUrl('./?focus=training')).toBe('./?focus=training&guest=1')
  })

  it('detects only the explicit guest flag', () => {
    expect(isGuestMode('https://example.test/?guest=1')).toBe(true)
    expect(isGuestMode('https://example.test/?guest=0')).toBe(false)
  })

  it('preserves guest mode when returning to the hub or a practice menu', () => {
    const current = 'https://example.test/hub/?game=schulte-static&guest=1'
    expect(learningHubUrl('', current)).toBe('https://example.test/hub/?guest=1')
    expect(learningHubUrl('?focus=training', current)).toBe('https://example.test/hub/?focus=training&guest=1')
  })

  it('does not add guest mode to signed-in navigation', () => {
    const current = 'https://example.test/hub/?game=schulte-static'
    expect(learningHubUrl('', current)).toBe('https://example.test/hub/')
  })
})
