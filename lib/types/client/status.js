/** All-zero counts: nothing to indicate, the default favicon stays. */
export const EMPTY_TAB_COUNTS = { running: 0, pending: 0, done: 0 };
/**
 * One session's tab state. A pending interaction outranks live activity, which
 * outranks the completion reminder; a session the kernel has not published a
 * status for is idle.
 * @param status - the session's entry in the ui-session status snapshot.
 * @param recentlyDone - monitor-tracked running→idle transition still within
 * its visibility window: shown green even when the kernel never armed the
 * completion reminder because the user was watching.
 * @returns the derived tab state.
 */
export function sessionTabState(status, recentlyDone = false) {
    if (status?.pendingInteraction !== undefined)
        return 'pending';
    if (status?.running === true)
        return 'running';
    if (status?.completionUnread === true || recentlyDone)
        return 'done';
    return 'idle';
}
/**
 * Aggregate every published session status into tab counts; idle sessions do
 * not count. While any session runs the completion reminders are dropped from
 * the counts: live activity owns the tab (blue, spinning), and a ring mixing
 * blue with green would report a running task as finished.
 * @param statuses - the ui-session status snapshot (`ctx.uiSession.sessionStatus`).
 * @param recentlyDone - ids whose running→idle transition is still within the
 * monitor's visibility window (shown green).
 * @returns per-state counts (never partial: a fresh object per call).
 */
export function aggregateTabCounts(statuses, recentlyDone) {
    const counts = { running: 0, pending: 0, done: 0 };
    for (const [id, status] of statuses) {
        switch (sessionTabState(status, recentlyDone?.has(id) === true)) {
            case 'running':
                counts.running += 1;
                break;
            case 'pending':
                counts.pending += 1;
                break;
            case 'done':
                counts.done += 1;
                break;
            case 'idle': break;
        }
    }
    if (counts.running > 0)
        counts.done = 0;
    return counts;
}
/**
 * Whether the counts show nothing to indicate.
 * @param counts - aggregate tab counts.
 * @returns true when every state is zero.
 */
export function isEmptyTabCounts(counts) {
    return counts.running === 0 && counts.pending === 0 && counts.done === 0;
}
//# sourceMappingURL=status.js.map