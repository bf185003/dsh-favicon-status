/**
 * DOM controller for the tab indicator: subscribes to the sessions list
 * projection, swaps the document favicon for the painted ring, spins it while
 * any session runs, and restores the original icon on idle and on dispose
 * (HMR safety). Timer ticks compute the rotation from the wall clock, so a
 * throttled background tab still advances the spin on every allowed tick.
 *
 * The monitor also tracks running→idle transitions: a session that finished
 * while the user watched (so the product's background-completion reminder was
 * never armed) stays shown green for the done-visibility window, then fades
 * back to the default favicon when nothing else indicates.
 */
import type { ObservableSnapshot, SessionListState, SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { FaviconRenderer } from './favicon.ts'
import type { TabCounts } from './status.ts'
import { aggregateTabCounts, EMPTY_TAB_COUNTS, isEmptyTabCounts } from './status.ts'

/** Monitor tuning; every field optional so the defaults stay deployment-tunable through Config. */
export interface TabStatusOptions {
  /** Full ring rotation period in ms while any session runs (default 1200). */
  spinMs?: number
  /** Animation tick in ms (default 150; browsers throttle background ticks). */
  tickMs?: number
  /** How long a running→idle transition stays shown green, in ms (default 30000). */
  doneVisibleMs?: number
}

/** The running monitor handle: re-read the list and tear down. */
export interface TabStatusMonitor {
  /** Re-evaluate from the latest list snapshot (initial paint included). */
  sync(): void
  /** Stop animating and restore the original favicon. */
  dispose(): void
}

const DEFAULT_SPIN_MS = 1200
const DEFAULT_TICK_MS = 150
const DEFAULT_DONE_VISIBLE_MS = 30_000

/** Find the document's primary tab favicon link (rel containing "icon"). */
function faviconLink(doc: Document): HTMLLinkElement | null {
  return doc.querySelector<HTMLLinkElement>('link[rel~="icon"]')
}

/**
 * Create the tab-status monitor over one sessions list source. The monitor
 * subscribes itself: list changes repaint immediately, and dispose tears the
 * subscription down with the favicon restore.
 * @param doc - document whose favicon link is swapped.
 * @param list - the sessions list projection (ctx.sessions.list).
 * @param renderer - frame painter (canvas-based in the browser, fake in specs).
 * @param options - spin/tick tuning.
 * @returns the monitor handle.
 */
export function createTabStatusMonitor(
  doc: Document,
  list: ObservableSnapshot<SessionListState>,
  renderer: FaviconRenderer,
  options: TabStatusOptions = {},
): TabStatusMonitor {
  const spinMs = options.spinMs ?? DEFAULT_SPIN_MS
  const tickMs = options.tickMs ?? DEFAULT_TICK_MS
  const doneVisibleMs = options.doneVisibleMs ?? DEFAULT_DONE_VISIBLE_MS
  const originalLink = faviconLink(doc)
  // Raw attribute, not the resolved property: restoring setAttribute keeps the
  // document's original relative URL exactly as authored.
  const originalHref = originalLink?.getAttribute('href')
  let ownLink: HTMLLinkElement | null = null
  let timer: number | undefined
  let counts: TabCounts = EMPTY_TAB_COUNTS
  /** Sessions whose running→idle transition is still shown green: id → expiry. */
  const doneUntil = new Map<SessionId, number>()
  /** Running sessions as of the previous snapshot, for transition detection. */
  let previousRunning = new Set<SessionId>()
  /** Dispose already ran: late image loads must not repaint a torn-down monitor. */
  let disposed = false

  const activeLink = (): HTMLLinkElement | null => {
    if (originalLink !== null) return originalLink
    if (ownLink !== null) return ownLink
    const created = doc.createElement('link')
    created.rel = 'icon'
    created.type = 'image/png'
    doc.head.appendChild(created)
    ownLink = created
    return created
  }

  const stop = (): void => {
    if (timer === undefined) return
    window.clearInterval(timer)
    timer = undefined
  }

  const restore = (): void => {
    stop()
    if (originalLink !== null) {
      if (originalHref !== null && originalHref !== undefined) {
        originalLink.setAttribute('href', originalHref)
      }
    } else if (ownLink !== null) {
      ownLink.remove()
      ownLink = null
    }
  }

  const paint = (rotation: number): void => {
    const dataUrl = renderer.render(counts, rotation)
    if (dataUrl === null) {
      restore()
      return
    }
    const link = activeLink()
    if (link !== null) link.href = dataUrl
  }

  const rotationOf = (): number => ((Date.now() % spinMs) / spinMs) * Math.PI * 2

  /**
   * Full re-evaluation: detect running→idle transitions, prune expired done
   * windows, re-aggregate counts, and repaint. Runs on every list change and
   * every animation tick, so an expiring done window restores the favicon
   * even when the list itself has not changed.
   */
  const evaluate = (): void => {
    const byId = list.getSnapshot().byId
    const now = Date.now()
    // Mark sessions that just stopped running: shown green briefly even when
    // the product's background-completion reminder was never armed (the user
    // was watching this session finish). The window is armed unconditionally,
    // not only when `completed` is absent: the product clears `completed` when
    // the user opens the session, and the window then keeps the green visible
    // for its full duration instead of dropping it the moment the reminder
    // clears.
    const runningIds = new Set<SessionId>()
    for (const summary of Object.values(byId)) {
      if (summary.running) runningIds.add(summary.id)
    }
    for (const id of previousRunning) {
      if (runningIds.has(id)) continue
      const summary: SessionSummary | undefined = byId[id]
      if (summary !== undefined && !summary.pendingInteraction) {
        doneUntil.set(id, now + doneVisibleMs)
      }
    }
    previousRunning = runningIds
    for (const [id, until] of doneUntil) {
      if (until <= now) doneUntil.delete(id)
    }
    const recentlyDone = doneUntil.size > 0 ? new Set(doneUntil.keys()) : undefined
    counts = aggregateTabCounts(byId, recentlyDone)
    if (isEmptyTabCounts(counts)) {
      restore()
      return
    }
    if (counts.running > 0 || doneUntil.size > 0) start()
    else stop()
    paint(counts.running > 0 ? rotationOf() : 0)
  }

  const start = (): void => {
    if (timer !== undefined) return
    timer = window.setInterval(evaluate, tickMs)
  }

  const unsubscribe = list.subscribe(evaluate)
  evaluate()
  // Load the document's original favicon graphic (the whale) into the ring's
  // hole; a missing or failed icon leaves the ring hollow. The document's own
  // icon is same-origin, so no crossOrigin attribute is needed.
  if (originalHref !== null && originalHref !== undefined) {
    const image = new Image()
    image.onload = () => {
      if (disposed) return
      renderer.setCenter(image)
      evaluate()
    }
    image.onerror = () => { /* keep the ring hollow */ }
    image.src = originalHref
  }
  return {
    sync: evaluate,
    dispose() {
      disposed = true
      unsubscribe()
      restore()
    },
  }
}
