/**
 * ui-favicon-status plugin halves: the browser entry's favicon wiring against a
 * real cordis Context with a stubbed ui-session status source (fiber teardown
 * proving the favicon restore - HMR safety) and the inert node entry.
 */
// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionStatus, SessionStatusSnapshot, UiSession } from '@deepseek-ai/dsh-client-ui-session/client'
import { apply, Config, inject } from '../src/client/index.ts'
import { apply as applyNode } from '../src/index.ts'

/** Minimal status entry: the monitor reads only the status fields through aggregation. */
function status(over: Partial<SessionStatus> = {}): SessionStatus {
  return { running: false, pendingInteraction: undefined, completionUnread: false, ...over }
}

/**
 * Manual ui-session status snapshot source; set() notifies subscribers like the
 * kernel's published `sessionStatus` observable.
 */
function makeStatus(initial: Record<string, SessionStatus>): {
  source: { getSnapshot(): SessionStatusSnapshot; subscribe(fn: () => void): () => void }
  set(entries: Record<string, SessionStatus>): void
} {
  const toSnapshot = (entries: Record<string, SessionStatus>): SessionStatusSnapshot =>
    new Map(Object.entries(entries).map(([id, entry]) => [id as SessionId, entry]))
  let snapshot = toSnapshot(initial)
  const listeners = new Set<() => void>()
  return {
    source: {
      getSnapshot: () => snapshot,
      subscribe: (fn) => {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
      },
    },
    set(entries) {
      snapshot = toSnapshot(entries)
      for (const fn of listeners) fn()
    },
  }
}

/** jsdom draws no 2D context and encodes no PNG - stub both ends of the renderer. */
function stubCanvas(): void {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({
      clearRect: vi.fn(),
      fillStyle: '',
      beginPath: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,ZmFrZQ==')
}

/** Boot the browser half over a context carrying a stubbed ui-session status snapshot. */
async function bench(entries: Record<string, SessionStatus>): Promise<{
  ctx: Context
  fiber: ReturnType<Context['plugin']>
  source: ReturnType<typeof makeStatus>
  link: HTMLLinkElement
}> {
  const ctx = new Context()
  const status = makeStatus(entries)
  ctx.provide('uiSession', { sessionStatus: status.source } as unknown as UiSession)
  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = '/favicon.svg'
  document.head.appendChild(link)
  const fiber = ctx.plugin(
    { inject, Config, apply },
    { colors: { running: '#111111', pending: '#222222', done: '#333333' }, spinMs: 1000, doneVisibleMs: 10_000 },
  )
  await fiber.await()
  return { ctx, fiber, source: status, link }
}

describe('ui-favicon-status browser half', () => {
  beforeEach(() => { stubCanvas() })
  afterEach(() => {
    document.head.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('declares the service it binds', () => {
    expect(inject).toEqual(['uiSession'])
  })

  it('paints the running state into the favicon link on boot', async () => {
    const { link } = await bench({ a: status({ running: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png;base64,/)
  })

  it('repaints when the status snapshot moves between states', async () => {
    const { source, link } = await bench({ a: status({ running: true }) })
    source.set({ a: status({ completionUnread: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png;base64,/)
    // The kernel clears the reminder when the user acknowledges the session;
    // the monitor's own done window keeps the green for its configured duration.
    source.set({ a: status() })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png;base64,/)
  })

  it('fiber teardown restores the original favicon (HMR safety)', async () => {
    const { fiber, link } = await bench({ a: status({ running: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/)
    await fiber.dispose()
    expect(link.getAttribute('href')).toBe('/favicon.svg')
  })

  it('validates config through the declared schema defaults', () => {
    expect(Config.toString()).toBeTruthy()
    // Defaults fill every field so an unconfigured row still paints.
    const result = Config['~standard'].validate({}) as
      | { value: { spinMs: number; doneVisibleMs: number; colors: Record<string, string> } }
      | { issues: unknown }
    expect('issues' in result).toBe(false)
    if ('issues' in result) throw new Error('expected config defaults to validate')
    expect(result.value.spinMs).toBe(1200)
    expect(result.value.doneVisibleMs).toBe(30_000)
    for (const color of Object.values(result.value.colors)) {
      expect(color).toMatch(/^#/)
    }
  })
})

describe('ui-favicon-status node half', () => {
  it('contributes no host behavior', () => {
    expect(applyNode).not.toThrow()
  })
})
