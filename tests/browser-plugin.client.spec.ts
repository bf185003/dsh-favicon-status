/**
 * ui-favicon-status plugin halves: the browser entry's favicon wiring against a
 * real cordis Context with a stubbed sessions list (fiber teardown proving
 * the favicon restore - HMR safety), the inert node entry, and the invariant
 * companion's ownership reservation.
 */
// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { ISessions, SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import { apply, Config, inject } from '../src/client/index.ts'
import { apply as applyNode } from '../src/index.ts'
import * as TabStatusInvariant from '../src/invariant.ts'

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

/** Manual sessions-list observable; set() notifies subscribers like the real projection. */
function makeList(initial: Record<string, SessionSummary>): {
  list: ISessions['list']
  set(rows: Record<string, SessionSummary>): void
} {
  let byId = initial
  const listeners = new Set<() => void>()
  return {
    list: {
      getSnapshot: () => ({ byId }) as never,
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

/** Boot the browser half over a context carrying a stubbed sessions service. */
async function bench(rows: Record<string, SessionSummary>): Promise<{
  ctx: Context
  fiber: ReturnType<Context['plugin']>
  list: ReturnType<typeof makeList>
  link: HTMLLinkElement
}> {
  const ctx = new Context()
  const list = makeList(rows)
  ctx.provide('sessions', { list: list.list } as ISessions)
  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = '/favicon.svg'
  document.head.appendChild(link)
  const fiber = ctx.plugin(
    { inject, Config, apply },
    { colors: { running: '#111111', pending: '#222222', done: '#333333' }, spinMs: 1000, doneVisibleMs: 10_000 },
  )
  await fiber.await()
  return { ctx, fiber, list, link }
}

describe('ui-favicon-status browser half', () => {
  beforeEach(() => { stubCanvas() })
  afterEach(() => {
    document.head.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('declares the service it binds', () => {
    expect(inject).toEqual(['sessions'])
  })

  it('paints the running state into the favicon link on boot', async () => {
    const { link } = await bench({ a: row('a', { running: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png;base64,/)
  })

  it('repaints when the list moves between states', async () => {
    const { list, link } = await bench({ a: row('a', { running: true }) })
    list.set({ a: row('a', { completed: true }) })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png;base64,/)
    // Opening the session clears the product reminder; the monitor's own done
    // window keeps the green for its configured duration.
    list.set({ a: row('a') })
    expect(link.getAttribute('href')).toMatch(/^data:image\/png;base64,/)
  })

  it('fiber teardown restores the original favicon (HMR safety)', async () => {
    const { fiber, link } = await bench({ a: row('a', { running: true }) })
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

describe('ui-favicon-status invariant companion', () => {
  it('reserves package ownership under its declared companion name', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    const fiber = ctx.plugin(TabStatusInvariant)
    await fiber.await()
    expect(TabStatusInvariant.name).toBe('client-ui-favicon-status-invariant')
    expect(TabStatusInvariant.inject).toEqual(['invariants'])
    // Emitting an unrelated event proves the companion installed no audit.
    expect(() => { (ctx.emit as (event: string) => void)('slots/changed') }).not.toThrow()
    await fiber.dispose()
  })
})
