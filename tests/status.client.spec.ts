/**
 * ui-favicon-status status derivation: per-session precedence (pending
 * interaction > running > completed reminder) and the aggregate counts over
 * the sessions list projection.
 */
import { describe, expect, it } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import {
  aggregateTabCounts, EMPTY_TAB_COUNTS, isEmptyTabCounts, sessionTabState,
} from '../src/client/status.ts'

/** Minimal list row: derivation reads only running/pendingInteraction/completed. */
function row(over: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: 's-1' as SessionId,
    displayTitle: 'row',
    running: false,
    blank: false,
    updatedAt: 0,
    ...over,
  }
}

describe('sessionTabState', () => {
  it('ranks a pending interaction above live activity', () => {
    expect(sessionTabState({ running: true, pendingInteraction: 'approval', completed: false })).toBe('pending')
    expect(sessionTabState({ running: false, pendingInteraction: 'question', completed: true })).toBe('pending')
    expect(sessionTabState({ running: true, pendingInteraction: 'plan-review', completed: false })).toBe('pending')
  })

  it('ranks running above the completed reminder', () => {
    expect(sessionTabState({ running: true, completed: true })).toBe('running')
  })

  it('reports the completed reminder only when actually armed', () => {
    expect(sessionTabState({ running: false, completed: true })).toBe('done')
    expect(sessionTabState({ running: false, completed: false })).toBe('idle')
    expect(sessionTabState({ running: false })).toBe('idle')
  })

  it('treats a recently-done session as done but below live states', () => {
    expect(sessionTabState({ running: false }, true)).toBe('done')
    expect(sessionTabState({ running: true }, true)).toBe('running')
    expect(sessionTabState({ running: false, pendingInteraction: 'approval' }, true)).toBe('pending')
    expect(sessionTabState({ running: false }, false)).toBe('idle')
  })
})

describe('aggregateTabCounts', () => {
  it('counts each non-idle state and ignores idle sessions', () => {
    const counts = aggregateTabCounts({
      a: row({ id: 'a' as SessionId, running: true }),
      b: row({ id: 'b' as SessionId, pendingInteraction: 'question' }),
      c: row({ id: 'c' as SessionId, completed: true }),
      d: row({ id: 'd' as SessionId }),
      e: row({ id: 'e' as SessionId, running: true }),
    })
    expect(counts).toEqual({ running: 2, pending: 1, done: 1 })
  })

  it('returns all-zero counts for an empty or all-idle list', () => {
    expect(aggregateTabCounts({})).toEqual(EMPTY_TAB_COUNTS)
    expect(aggregateTabCounts({ a: row(), b: row({ id: 'b' as SessionId }) })).toEqual(EMPTY_TAB_COUNTS)
  })

  it('counts recently-done ids as done and ignores everything else', () => {
    const recentlyDone = new Set(['a' as SessionId, 'z' as SessionId])
    const counts = aggregateTabCounts({
      a: row({ id: 'a' as SessionId }),
      b: row({ id: 'b' as SessionId }),
    }, recentlyDone)
    expect(counts).toEqual({ running: 0, pending: 0, done: 1 })
  })

  it('never reuses the shared empty constant (callers may mutate)', () => {
    expect(aggregateTabCounts({})).not.toBe(EMPTY_TAB_COUNTS)
  })
})

describe('isEmptyTabCounts', () => {
  it('is true only for all-zero counts', () => {
    expect(isEmptyTabCounts({ running: 0, pending: 0, done: 0 })).toBe(true)
    expect(isEmptyTabCounts({ running: 1, pending: 0, done: 0 })).toBe(false)
    expect(isEmptyTabCounts({ running: 0, pending: 1, done: 0 })).toBe(false)
    expect(isEmptyTabCounts({ running: 0, pending: 0, done: 1 })).toBe(false)
  })
})
