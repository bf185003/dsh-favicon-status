import type { SessionStatusSnapshot } from '@deepseek-ai/dsh-client-ui-session/client';
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
/** The running monitor handle: re-read the status source and tear down. */
export interface TabStatusMonitor {
    /** Re-evaluate from the latest status snapshot (initial paint included). */
    sync(): void;
    /** Stop animating and restore the original favicon. */
    dispose(): void;
}
/**
 * The observable status source the monitor subscribes to. The kernel's
 * `UiSession.sessionStatus` satisfies it structurally, so the monitor needs no
 * dependency on the ui-slots observable types.
 */
export interface TabStatusSource {
    /** @returns the current per-session status snapshot. */
    getSnapshot(): SessionStatusSnapshot;
    /**
     * @param listener - called after every published snapshot change.
     * @returns the disposer removing the listener.
     */
    subscribe(listener: () => void): () => void;
}
/**
 * Create the tab-status monitor over the ui-session status snapshot, which
 * carries every session fact the indicator reads: running, the effective
 * pending interaction, and the background-completion reminder. The monitor
 * subscribes itself: a status change repaints immediately, and dispose tears
 * the subscription down with the favicon restore.
 * @param doc - document whose favicon link is swapped.
 * @param sessionStatus - the ui-session status snapshot source
 * (`ctx.uiSession.sessionStatus`).
 * @param renderer - frame painter (canvas-based in the browser, fake in specs).
 * @param options - spin/tick tuning.
 * @returns the monitor handle.
 */
export declare function createTabStatusMonitor(doc: Document, sessionStatus: TabStatusSource, renderer: FaviconRenderer, options?: TabStatusOptions): TabStatusMonitor;
//# sourceMappingURL=monitor.d.ts.map