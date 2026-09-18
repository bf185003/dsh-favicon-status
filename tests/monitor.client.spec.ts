/**
 * ui-favicon-status DOM controller: favicon swap, spin timer, idle restore, and
 * dispose teardown - driven through a fake renderer and a manual ui-session
 * status source so no canvas is needed.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionStatus, SessionStatusSnapshot } from '@deepseek-ai/dsh-client-ui-session/client'
import type { FaviconRenderer } from '../src/client/favicon.ts'
import { createTabStatusMonitor, type TabStatusMonitor, type TabStatusSource } from '../src/client/monitor.ts'
import type { TabCounts } from '../src/client/status.ts'

/** Minimal status entry: the monitor reads only the status fields through aggregation. */
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

/** Manual status source: set() notifies subscribers like the published snapshot. */
function makeStatus(initial: Record<string, SessionStatus> = {}): {
  source: TabStatusSource
  set(entries: Record<string, SessionStatus>): void
} {
  let current = snapshot(initial)
  const listeners = new Set<() => void>()
  return {
    source: {
      getSnapshot: () => current,
      subscribe: (fn) => {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
      },
    },
    set(entries) {
      current = snapshot(entries)
      for (const fn of listeners) fn()
    },
  }
}

/** Recording renderer: returns a fresh fake data URL per call and records centers. */
function makeRenderer(): {
  renderer: FaviconRenderer
  calls: { counts: TabCounts; rotation: number }[]
  centers: (CanvasImageSource | null)[]
} {
  const calls: { counts: TabCounts; rotation: number }[] = []
  const centers: (CanvasImageSource | null)[] = []
  return {
    calls,
    centers,
    renderer: {
      render(counts, rotation) {
        calls.push({ counts: { ...counts }, rotation })
        return `data:image/png;base64,${calls.length}`
      },
      setCenter(image) {
        centers.push(image)
      },
    },
  }
}

/** A monitor over a fresh status source, with the document's original icon link. */
function bench(entries: Record<string, SessionStatus> = {}): {
  monitor: TabStatusMonitor
  status: ReturnType<typeof makeStatus>
  calls: { counts: TabCounts; rotation: number }[]
  centers: (CanvasImageSource | null)[]
  link: HTMLLinkElement
} {
  const status = makeStatus(entries)
  const { renderer, calls, centers } = makeRenderer()
  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = '/favicon.svg'
  document.head.appendChild(link)
  const monitor = createTabStatusMonitor(document, status.source, renderer, {
    spinMs: 1000, tickMs: 100, doneVisibleMs: 10_000,
  })
  return { monitor, status, calls, centers, link }}

describe('createTabStatusMonitor', () => {
  beforeEach(() => { document.head.innerHTML = '' })
  afterEach(() => {
    document.head.innerHTML = ''
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('paints from the current snapshot on creation', () => {
    const { calls } = bench({ a: status({ running: true }) })
    expect(calls).toHaveLength(1)
    expect(calls[0]!.counts).toEqual({ running: 1, pending: 0, done: 0 })
  })

  it('repaints on snapshot changes and passes the aggregate counts', () => {
    const { status: source, calls } = bench({ a: status({ running: true }) })
    source.set({ a: status({ running: true }), b: status({ pendingInteraction: pendingFor('b') }) })
    expect(calls).toHaveLength(2)
    expect(calls[1]!.counts).toEqual({ running: 1, pending: 1, done: 0 })
  })

  it('keeps background completion reminders out of the counts while a session runs', () => {
    const { calls } = bench({ a: status({ completionUnread: true }), b: status({ running: true }) })
    expect(calls[0]!.counts).toEqual({ running: 1, pending: 0, done: 0 })
  })

  it('swaps the favicon href to the rendered data URL', () => {
    const { link } = bench({ a: status({ running: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png;base64,/)
  })

  it('spins while any session runs and freezes when none does', () => {
    vi.useFakeTimers()
    const { status: source, calls, monitor } = bench({ a: status({ running: true }) })
    const first = calls[0]!.rotation
    vi.advanceTimersByTime(250)
    expect(calls.length).toBeGreaterThan(1)
    expect(calls[1]!.rotation).not.toBe(first)
    // Running stops into a pending interaction: no done window opens, the
    // timer stops and one static amber frame (rotation 0) paints.
    source.set({ a: status({ pendingInteraction: pendingFor('a') }) })
    vi.advanceTimersByTime(500)
    expect(calls.at(-1)!.rotation).toBe(0)
    monitor.dispose()
  })

  it('restores the original favicon when every session is idle with no transition', () => {
    const { link } = bench({ a: status() })
    expect(link.getAttribute('href')).toBe('/favicon.svg')
  })

  it('shows a just-finished session green for the done window, then restores', () => {
    vi.useFakeTimers()
    const { link, status: source, calls } = bench({ a: status({ running: true }) })
    // Running → idle is a completion: green now, even without the kernel's
    // background-completion reminder (the user was watching).
    source.set({ a: status() })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
    expect(calls[calls.length - 1]!.counts).toEqual({ running: 0, pending: 0, done: 1 })
    // After the window expires the tick notices and restores the default.
    vi.advanceTimersByTime(10_100)
    expect(link.getAttribute('href')).toBe('/favicon.svg')
  })

  it('keeps the timer alive while a done window is open, then stops it', () => {
    vi.useFakeTimers()
    const { link, status: source, calls } = bench({ a: status({ running: true }) })
    source.set({ a: status() })
    const count = calls.length
    vi.advanceTimersByTime(300)
    // No session runs, yet the timer repaints the static green ring.
    expect(calls.length).toBeGreaterThan(count)
    expect(calls[calls.length - 1]!.rotation).toBe(0)
    vi.advanceTimersByTime(10_000)
    expect(link.getAttribute('href')).toBe('/favicon.svg')
    const settled = calls.length
    vi.advanceTimersByTime(500)
    expect(calls).toHaveLength(settled)
  })

  it('keeps the done window green after the kernel reminder clears', () => {
    vi.useFakeTimers()
    const { link, status: source, calls } = bench({ a: status({ running: true }) })
    // The kernel arms its own background-completion reminder...
    source.set({ a: status({ completionUnread: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
    // ...acknowledging the session clears it: the monitor's own window still shows green.
    source.set({ a: status() })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
    expect(calls[calls.length - 1]!.counts).toEqual({ running: 0, pending: 0, done: 1 })
    vi.advanceTimersByTime(10_100)
    expect(link.getAttribute('href')).toBe('/favicon.svg')
  })

  it('clears the done window when the page becomes visible again', () => {
    vi.useFakeTimers()
    const { link, status: source, calls } = bench({ a: status({ running: true }) })
    source.set({ a: status() })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
    // Returning to the dsh page: the green reminder is a background hint, so
    // visibility clears it at once instead of waiting out the window.
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(link.getAttribute('href')).toBe('/favicon.svg')
    const settled = calls.length
    vi.advanceTimersByTime(500)
    expect(calls).toHaveLength(settled)
  })

  it('hides the done window while any session runs (live activity owns the tab)', () => {
    vi.useFakeTimers()
    const { link, status: source, calls } = bench({ a: status({ running: true }) })
    // A finishes; the done window opens.
    source.set({ a: status() })
    expect(calls[calls.length - 1]!.counts).toEqual({ running: 0, pending: 0, done: 1 })
    // B starts running inside the window: the counts drop the reminder and the
    // ring spins blue again instead of staying green.
    source.set({ a: status({ completionUnread: true }), b: status({ running: true }) })
    expect(calls[calls.length - 1]!.counts).toEqual({ running: 1, pending: 0, done: 0 })
    const first = calls[calls.length - 1]!.rotation
    vi.advanceTimersByTime(250)
    expect(calls[calls.length - 1]!.rotation).not.toBe(first)
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
  })

  it('removes the visibility listener on dispose', () => {
    const { monitor, status: source, calls } = bench({ a: status({ running: true }) })
    source.set({ a: status() })
    monitor.dispose()
    const settled = calls.length
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(calls).toHaveLength(settled)
  })

  it('loads the original favicon as the ring center and repaints on load', () => {
    class FakeImage {
      static instances: FakeImage[] = []
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      constructor() { FakeImage.instances.push(this) }
    }
    vi.stubGlobal('Image', FakeImage)
    const { link, centers, calls } = bench({ a: status({ running: true }) })
    const image = FakeImage.instances[0]!
    expect(image.src).toBe('/favicon.svg')
    expect(centers).toHaveLength(0)
    image.onload?.()
    expect(centers).toEqual([image])
    // The load repaints: one extra frame beyond the initial paint.
    expect(calls.length).toBeGreaterThanOrEqual(2)
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
  })

  it('ignores a late center-image load after dispose', () => {
    class FakeImage {
      static instances: FakeImage[] = []
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      constructor() { FakeImage.instances.push(this) }
    }
    vi.stubGlobal('Image', FakeImage)
    const { monitor, calls } = bench({ a: status({ running: true }) })
    monitor.dispose()
    const settled = calls.length
    FakeImage.instances[0]!.onload?.()
    expect(calls).toHaveLength(settled)
  })

  it('keeps the ring hollow when the center image fails to load', () => {
    class FakeImage {
      static instances: FakeImage[] = []
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      constructor() { FakeImage.instances.push(this) }
    }
    vi.stubGlobal('Image', FakeImage)
    const { centers, calls } = bench({ a: status({ running: true }) })
    const before = calls.length
    FakeImage.instances[0]!.onerror?.()
    expect(centers).toHaveLength(0)
    expect(calls).toHaveLength(before)
  })

  it('creates its own favicon link when the document has none and removes it on dispose', () => {
    const source = makeStatus({ a: status({ running: true }) })
    const { renderer } = makeRenderer()
    const monitor = createTabStatusMonitor(document, source.source, renderer)
    const created = document.head.querySelector('link[rel~="icon"]')
    expect(created).not.toBeNull()
    monitor.dispose()
    expect(document.head.querySelector('link[rel~="icon"]')).toBeNull()
  })

  it('dispose restores the original href and stops the timer (HMR safety)', () => {
    vi.useFakeTimers()
    const { monitor, link, calls } = bench({ a: status({ running: true }) })
    monitor.dispose()
    expect(link.getAttribute('href')).toBe('/favicon.svg')
    const count = calls.length
    vi.advanceTimersByTime(500)
    expect(calls).toHaveLength(count)
  })

  it('stays inert when a renderer reports nothing to paint', () => {
    const source = makeStatus({ a: status({ running: true }) })
    const { renderer } = makeRenderer()
    renderer.render = () => null
    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = '/favicon.svg'
    document.head.appendChild(link)
    const monitor = createTabStatusMonitor(document, source.source, renderer)
    expect(link.getAttribute('href')).toBe('/favicon.svg')
    monitor.dispose()
  })
})
