/**
 * ui-favicon-status DOM controller: favicon swap, spin timer, idle restore, and
 * dispose teardown - driven through a fake renderer and a manual sessions
 * list so no canvas is needed.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { ObservableSnapshot, SessionListState, SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import type { FaviconRenderer } from '../src/client/favicon.ts'
import { createTabStatusMonitor, type TabStatusMonitor } from '../src/client/monitor.ts'
import type { TabCounts } from '../src/client/status.ts'

/** Minimal list row: the monitor reads only the status fields through aggregation. */
function row(id: string, over: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: id as SessionId,
    displayTitle: id,
    running: false,
    blank: false,
    updatedAt: 0,
    ...over,
  }
}

/** Manual sessions-list observable: set() notifies subscribers like the real projection. */
function makeList(initial: Record<string, SessionSummary> = {}): {
  list: ObservableSnapshot<SessionListState>
  set(rows: Record<string, SessionSummary>): void
} {
  let byId = initial
  const listeners = new Set<() => void>()
  return {
    list: {
      getSnapshot: () => ({ byId }) as unknown as SessionListState,
      subscribe: (fn) => {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
      },
    },
    set(rows) {
      byId = rows
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

/** A monitor over a fresh list, with the document's original icon link. */
function bench(rows: Record<string, SessionSummary> = {}): {
  monitor: TabStatusMonitor
  list: ReturnType<typeof makeList>
  calls: { counts: TabCounts; rotation: number }[]
  centers: (CanvasImageSource | null)[]
  link: HTMLLinkElement
} {
  const list = makeList(rows)
  const { renderer, calls, centers } = makeRenderer()
  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = '/favicon.svg'
  document.head.appendChild(link)
  const monitor = createTabStatusMonitor(document, list.list, renderer, { spinMs: 1000, tickMs: 100, doneVisibleMs: 10_000 })
  return { monitor, list, calls, centers, link }
}

describe('createTabStatusMonitor', () => {
  beforeEach(() => { document.head.innerHTML = '' })
  afterEach(() => {
    document.head.innerHTML = ''
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('paints from the current snapshot on creation', () => {
    const { calls } = bench({ a: row('a', { running: true }) })
    expect(calls).toHaveLength(1)
    expect(calls[0]!.counts).toEqual({ running: 1, pending: 0, done: 0 })
  })

  it('repaints on list changes and passes the aggregate counts', () => {
    const { list, calls } = bench({ a: row('a', { running: true }) })
    list.set({ a: row('a', { running: true }), b: row('b', { completed: true }) })
    expect(calls).toHaveLength(2)
    expect(calls[1]!.counts).toEqual({ running: 1, pending: 0, done: 1 })
  })

  it('swaps the favicon href to the rendered data URL', () => {
    const { link } = bench({ a: row('a', { running: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png;base64,/)
  })

  it('spins while any session runs and freezes when none does', () => {
    vi.useFakeTimers()
    const { list, calls, monitor } = bench({ a: row('a', { running: true }) })
    const first = calls[0]!.rotation
    vi.advanceTimersByTime(250)
    expect(calls.length).toBeGreaterThan(1)
    expect(calls[1]!.rotation).not.toBe(first)
    // Running stops into a pending interaction: no done window opens, the
    // timer stops and one static amber frame (rotation 0) paints.
    list.set({ a: row('a', { pendingInteraction: 'question' }) })
    const count = calls.length
    vi.advanceTimersByTime(500)
    expect(calls).toHaveLength(count)
    expect(calls[count - 1]!.rotation).toBe(0)
    monitor.dispose()
  })

  it('restores the original favicon when every session is idle with no transition', () => {
    const { link } = bench({ a: row('a') })
    expect(link.getAttribute('href')).toBe('/favicon.svg')
  })

  it('shows a just-finished session green for the done window, then restores', () => {
    vi.useFakeTimers()
    const { link, list, calls } = bench({ a: row('a', { running: true }) })
    // Running 鈫?idle is a completion: green now, even without the product's
    // background-completion reminder (the user was watching).
    list.set({ a: row('a') })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
    expect(calls[calls.length - 1]!.counts).toEqual({ running: 0, pending: 0, done: 1 })
    // After the window expires the tick notices and restores the default.
    vi.advanceTimersByTime(10_100)
    expect(link.getAttribute('href')).toBe('/favicon.svg')
  })

  it('keeps the timer alive while a done window is open, then stops it', () => {
    vi.useFakeTimers()
    const { link, list, calls } = bench({ a: row('a', { running: true }) })
    list.set({ a: row('a') })
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

  it('keeps the done window green after the product reminder clears', () => {
    vi.useFakeTimers()
    const { link, list, calls } = bench({ a: row('a', { running: true }) })
    // Background completion arms the product reminder...
    list.set({ a: row('a', { completed: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
    // ...opening the session clears it: the monitor's own window still shows green.
    list.set({ a: row('a') })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
    expect(calls[calls.length - 1]!.counts).toEqual({ running: 0, pending: 0, done: 1 })
    vi.advanceTimersByTime(10_100)
    expect(link.getAttribute('href')).toBe('/favicon.svg')
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
    const { link, centers, calls } = bench({ a: row('a', { running: true }) })
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
    const { monitor, calls } = bench({ a: row('a', { running: true }) })
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
    const { centers, calls } = bench({ a: row('a', { running: true }) })
    const before = calls.length
    FakeImage.instances[0]!.onerror?.()
    expect(centers).toHaveLength(0)
    expect(calls).toHaveLength(before)
  })

  it('creates its own favicon link when the document has none and removes it on dispose', () => {
    const list = makeList({ a: row('a', { running: true }) })
    const { renderer } = makeRenderer()
    const monitor = createTabStatusMonitor(document, list.list, renderer)
    const created = document.head.querySelector('link[rel~="icon"]')
    expect(created).not.toBeNull()
    monitor.dispose()
    expect(document.head.querySelector('link[rel~="icon"]')).toBeNull()
  })

  it('dispose restores the original href and stops the timer (HMR safety)', () => {
    vi.useFakeTimers()
    const { monitor, link, calls } = bench({ a: row('a', { running: true }) })
    monitor.dispose()
    expect(link.getAttribute('href')).toBe('/favicon.svg')
    const count = calls.length
    vi.advanceTimersByTime(500)
    expect(calls).toHaveLength(count)
  })

  it('stays inert when a renderer reports nothing to paint', () => {
    const list = makeList({ a: row('a', { running: true }) })
    const { renderer } = makeRenderer()
    renderer.render = () => null
    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = '/favicon.svg'
    document.head.appendChild(link)
    const monitor = createTabStatusMonitor(document, list.list, renderer)
    expect(link.getAttribute('href')).toBe('/favicon.svg')
    monitor.dispose()
  })
})
