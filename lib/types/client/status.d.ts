/**
 * Pure status derivation for the browser tab indicator: one session's tab
 * state and the aggregate counts over the ui-session status snapshot. The
 * precedence and the facts come from the kernel's `SessionStatus` (pending
 * interaction > running > completion reminder), so the tab never disagrees
 * with the in-UI state.
 */
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { SessionStatus, SessionStatusSnapshot } from '@deepseek-ai/dsh-client-ui-session/client';
/** One session's tab-indicator state. */
export type TabSessionState = 'running' | 'pending' | 'done' | 'idle';
/** Aggregate counts per non-idle tab state across the session status snapshot. */
export interface TabCounts {
    /** Sessions currently executing. */
    running: number;
    /** Sessions waiting on the user (approval / plan review / question). */
    pending: number;
    /** Sessions that finished in the background (the green done reminder). */
    done: number;
}
/** All-zero counts: nothing to indicate, the default favicon stays. */
export declare const EMPTY_TAB_COUNTS: TabCounts;
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
export declare function sessionTabState(status: SessionStatus | undefined, recentlyDone?: boolean): TabSessionState;
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
export declare function aggregateTabCounts(statuses: SessionStatusSnapshot, recentlyDone?: ReadonlySet<SessionId>): TabCounts;
/**
 * Whether the counts show nothing to indicate.
 * @param counts - aggregate tab counts.
 * @returns true when every state is zero.
 */
export declare function isEmptyTabCounts(counts: TabCounts): boolean;
//# sourceMappingURL=status.d.ts.map