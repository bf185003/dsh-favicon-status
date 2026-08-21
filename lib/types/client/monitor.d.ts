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
 * back to the default favicon when nothing else indicates. The window is a
 * background reminder only: returning to the page clears it immediately, and
 * while any session runs the live activity owns the tab (blue, spinning).
 */
import type { ObservableSnapshot, SessionListState } from '@deepseek-ai/dsh-client-runtime/client';
import type { FaviconRenderer } from './favicon.ts';
/** Monitor tuning; every field optional so the defaults stay deployment-tunable through Config. */
export interface TabStatusOptions {
    /** Full ring rotation period in ms while any session runs (default 1200). */
    spinMs?: number;
    /** Animation tick in ms (default 150; browsers throttle background ticks). */
    tickMs?: number;
    /** How long a running→idle transition stays shown green, in ms (default 30000). */
    doneVisibleMs?: number;
}
/** The running monitor handle: re-read the list and tear down. */
export interface TabStatusMonitor {
    /** Re-evaluate from the latest list snapshot (initial paint included). */
    sync(): void;
    /** Stop animating and restore the original favicon. */
    dispose(): void;
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
export declare function createTabStatusMonitor(doc: Document, list: ObservableSnapshot<SessionListState>, renderer: FaviconRenderer, options?: TabStatusOptions): TabStatusMonitor;
//# sourceMappingURL=monitor.d.ts.map