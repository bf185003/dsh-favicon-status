/** All-zero counts: nothing to indicate, the default favicon stays. */
export const EMPTY_TAB_COUNTS = { running: 0, pending: 0, done: 0 };
/**
 * One session's tab state. A pending interaction outranks live activity,
 * which outranks the done reminders; everything else is idle (unprompted,
 * open-but-quiet, or a session the user is watching).
 * @param summary - the sessions list row.
 * @param recentlyDone - monitor-tracked running→idle transition still within
 * its visibility window: shown green even when the background-completion
 * reminder is not armed (the user was watching, so the product never armed it).
 * @returns the derived tab state.
 */
export function sessionTabState(summary, recentlyDone = false) {
    if (summary.pendingInteraction !== undefined)
        return 'pending';
    if (summary.running)
        return 'running';
    if (summary.completed === true || recentlyDone)
        return 'done';
    return 'idle';
}
/**
 * Aggregate every listed session into tab counts; idle sessions do not count.
 * @param byId - the sessions list projection's id-to-row map.
 * @param recentlyDone - ids of sessions whose running→idle transition is
 * still within the monitor's visibility window (shown green).
 * @returns per-state counts (never partial: a fresh object per call).
 */
export function aggregateTabCounts(byId, recentlyDone) {
    const counts = { running: 0, pending: 0, done: 0 };
    for (const summary of Object.values(byId)) {
        switch (sessionTabState(summary, recentlyDone?.has(summary.id) === true)) {
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