/**
 * ui-favicon-status status derivation: per-session precedence (pending
 * interaction > running > completion reminder) and the aggregate counts over
 * the ui-session status snapshot.
 */
import { describe, expect, it } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionStatus, SessionStatusSnapshot } from '@deepseek-ai/dsh-client-ui-session/client'
import {
  aggregateTabCounts, EMPTY_TAB_COUNTS, isEmptyTabCounts, sessionTabState,
} from '../src/client/status.ts'

/** Minimal status entry: derivation reads only running/pendingInteraction/completionUnread. */
function status(over: Partial<SessionStatus> = {}): SessionStatus {
  return { running: false, pendingInteraction: undefined, completionUnread: false, ...over }
}

/**
 * One pending interaction owned by the given session. Each UI domain
 * declaration-merges its own value into the union, so the fixture carries only
 * the shared identity fields the derivation reads.
 */
function pendingFor(id: string): NonNullable<SessionStatus['pendingInteraction']> {
  return { key: 'req-1', kind: 'approval', sessionId: id as SessionId } as unknown as NonNullable<SessionStatus['pendingInteraction']>
}

/** Status snapshot keyed by session id, as the kernel publishes it. */
function snapshot(entries: Record<string, SessionStatus>): SessionStatusSnapshot {
  return new Map(Object.entries(entries).map(([id, entry]) => [id as SessionId, entry]))
}

describe('sessionTabState', () => {
  it('ranks a pending interaction above live activity', () => {
    expect(sessionTabState(status({ running: true, pendingInteraction: pendingFor('s-1') }))).toBe('pending')
    expect(sessionTabState(status({ completionUnread: true, pendingInteraction: pendingFor('s-1') }))).toBe('pending')
  })

  it('ranks running above the completion reminder', () => {
    expect(sessionTabState(status({ running: true, completionUnread: true }))).toBe('running')
  })

  it('reports the completion reminder only when actually armed', () => {
    expect(sessionTabState(status({ completionUnread: true }))).toBe('done')
    expect(sessionTabState(status())).toBe('idle')
    expect(sessionTabState(undefined)).toBe('idle')
    expect(sessionTabState(status({ running: undefined }))).toBe('idle')
  })

  it('treats a recently-done session as done but below live states', () => {
    expect(sessionTabState(status(), true)).toBe('done')
    expect(sessionTabState(status({ running: true }), true)).toBe('running')
    expect(sessionTabState(status({ pendingInteraction: pendingFor('s-1') }), true)).toBe('pending')
    expect(sessionTabState(status(), false)).toBe('idle')
  })
})

describe('aggregateTabCounts', () => {
  it('counts each non-idle state and ignores idle sessions', () => {
    const counts = aggregateTabCounts(
      snapshot({
        a: status({ pendingInteraction: pendingFor('a') }),
        b: status({ completionUnread: true }),
        c: status(),
        d: status({ completionUnread: true }),
        e: status({ pendingInteraction: pendingFor('e') }),
      }),
    )
    expect(counts).toEqual({ running: 0, pending: 2, done: 2 })
  })

  it('returns all-zero counts for an empty or all-idle snapshot', () => {
    expect(aggregateTabCounts(snapshot({}))).toEqual(EMPTY_TAB_COUNTS)
    expect(aggregateTabCounts(snapshot({ a: status(), b: status() }))).toEqual(EMPTY_TAB_COUNTS)
  })

  it('drops the completion reminders while any session runs (live activity owns the tab)', () => {
    const counts = aggregateTabCounts(snapshot({
      a: status({ completionUnread: true }),
      b: status({ running: true }),
    }))
    expect(counts).toEqual({ running: 1, pending: 0, done: 0 })
  })

  it('counts recently-done ids as done and ignores everything else', () => {
    const recentlyDone = new Set(['a' as SessionId, 'z' as SessionId])
    const counts = aggregateTabCounts(snapshot({ a: status(), b: status() }), recentlyDone)
    expect(counts).toEqual({ running: 0, pending: 0, done: 1 })
  })

  it('keeps a pending interaction visible next to a running session', () => {
    const counts = aggregateTabCounts(snapshot({
      a: status({ pendingInteraction: pendingFor('a') }),
      b: status({ running: true }),
    }))
    expect(counts).toEqual({ running: 1, pending: 1, done: 0 })
  })

  it('never reuses the shared empty constant (callers may mutate)', () => {
    expect(aggregateTabCounts(snapshot({}))).not.toBe(EMPTY_TAB_COUNTS)
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
