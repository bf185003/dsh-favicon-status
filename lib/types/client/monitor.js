import { aggregateTabCounts, EMPTY_TAB_COUNTS, isEmptyTabCounts } from "./status.js";
const DEFAULT_SPIN_MS = 1200;
const DEFAULT_TICK_MS = 150;
const DEFAULT_DONE_VISIBLE_MS = 30_000;
/** Find the document's primary tab favicon link (rel containing "icon"). */
function faviconLink(doc) {
    return doc.querySelector('link[rel~="icon"]');
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
export function createTabStatusMonitor(doc, sessionStatus, renderer, options = {}) {
    const spinMs = options.spinMs ?? DEFAULT_SPIN_MS;
    const tickMs = options.tickMs ?? DEFAULT_TICK_MS;
    const doneVisibleMs = options.doneVisibleMs ?? DEFAULT_DONE_VISIBLE_MS;
    const originalLink = faviconLink(doc);
    // Raw attribute, not the resolved property: restoring setAttribute keeps the
    // document's original relative URL exactly as authored.
    const originalHref = originalLink?.getAttribute('href');
    let ownLink = null;
    let timer;
    let counts = EMPTY_TAB_COUNTS;
    /** Sessions whose running→idle transition is still shown green: id → expiry. */
    const doneUntil = new Map();
    /** Running sessions as of the previous snapshot, for transition detection. */
    let previousRunning = new Set();
    /** Dispose already ran: late image loads must not repaint a torn-down monitor. */
    let disposed = false;
    const activeLink = () => {
        if (originalLink !== null)
            return originalLink;
        if (ownLink !== null)
            return ownLink;
        const created = doc.createElement('link');
        created.rel = 'icon';
        created.type = 'image/png';
        doc.head.appendChild(created);
        ownLink = created;
        return created;
    };
    const stop = () => {
        if (timer === undefined)
            return;
        window.clearInterval(timer);
        timer = undefined;
    };
    const restore = () => {
        stop();
        if (originalLink !== null) {
            if (originalHref !== null && originalHref !== undefined) {
                originalLink.setAttribute('href', originalHref);
            }
        }
        else if (ownLink !== null) {
            ownLink.remove();
            ownLink = null;
        }
    };
    const paint = (rotation) => {
        const dataUrl = renderer.render(counts, rotation);
        if (dataUrl === null) {
            restore();
            return;
        }
        const link = activeLink();
        if (link !== null)
            link.href = dataUrl;
    };
    const rotationOf = () => ((Date.now() % spinMs) / spinMs) * Math.PI * 2;
    /**
     * Full re-evaluation: detect running→idle transitions, prune expired done
     * windows, re-aggregate counts, and repaint. Runs on every status change and
     * every animation tick, so an expiring done window restores the favicon even
     * when the snapshot itself has not changed.
     */
    const evaluate = () => {
        const statuses = sessionStatus.getSnapshot();
        const now = Date.now();
        // Mark sessions that just stopped running: shown green briefly even when
        // the kernel's completion reminder was never armed (the user was watching
        // this session finish). The window is armed unconditionally, not only when
        // `completionUnread` is absent: the kernel clears that reminder when the
        // user acknowledges the session, and the window then keeps the green
        // visible for its full duration instead of dropping it the moment the
        // reminder clears.
        const runningIds = new Set();
        for (const [id, status] of statuses) {
            if (status.running === true)
                runningIds.add(id);
        }
        for (const id of previousRunning) {
            if (runningIds.has(id))
                continue;
            const status = statuses.get(id);
            if (status !== undefined && status.pendingInteraction === undefined) {
                doneUntil.set(id, now + doneVisibleMs);
            }
        }
        previousRunning = runningIds;
        for (const [id, until] of doneUntil) {
            if (until <= now)
                doneUntil.delete(id);
        }
        // The done window is a background reminder: while any session runs the
        // live activity owns the tab (blue, spinning), so the window does not
        // participate in the counts until every session is quiet again.
        const recentlyDone = doneUntil.size > 0 && runningIds.size === 0 ? new Set(doneUntil.keys()) : undefined;
        counts = aggregateTabCounts(statuses, recentlyDone);
        if (isEmptyTabCounts(counts)) {
            restore();
            return;
        }
        if (counts.running > 0 || doneUntil.size > 0)
            start();
        else
            stop();
        paint(counts.running > 0 ? rotationOf() : 0);
    };
    const start = () => {
        if (timer !== undefined)
            return;
        timer = window.setInterval(evaluate, tickMs);
    };
    const unsubscribeStatus = sessionStatus.subscribe(evaluate);
    // The done window is a background reminder: returning to the page (tab
    // visible) means the user sees the UI itself, so the green reminder clears
    // immediately instead of outliving its window.
    const onVisibilityChange = () => {
        if (doc.visibilityState !== 'visible')
            return;
        doneUntil.clear();
        evaluate();
    };
    doc.addEventListener('visibilitychange', onVisibilityChange);
    evaluate();
    // Load the document's original favicon graphic (the whale) into the ring's
    // hole; a missing or failed icon leaves the ring hollow. The document's own
    // icon is same-origin, so no crossOrigin attribute is needed.
    if (originalHref !== null && originalHref !== undefined) {
        const image = new Image();
        image.onload = () => {
            if (disposed)
                return;
            renderer.setCenter(image);
            evaluate();
        };
        image.onerror = () => { };
        image.src = originalHref;
    }
    return {
        sync: evaluate,
        dispose() {
            disposed = true;
            unsubscribeStatus();
            doc.removeEventListener('visibilitychange', onVisibilityChange);
            restore();
        },
    };
}
//# sourceMappingURL=monitor.js.map