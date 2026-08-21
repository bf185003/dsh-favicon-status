/**
 * Pure status derivation for the browser tab indicator: one session's tab
 * state and the aggregate counts over the sessions list projection. The
 * precedence mirrors the sidebar's status dots (pending interaction > running
 * > completed reminder), so the tab never disagrees with the in-UI state.
 */
import type { SessionSummary } from '@deepseek-ai/dsh-client-runtime/client';
/** One session's tab-indicator state. */
export type TabSessionState = 'running' | 'pending' | 'done' | 'idle';
/** Aggregate counts per non-idle tab state across the session list. */
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
 * One session's tab state. A pending interaction outranks live activity,
 * which outranks the done reminders; everything else is idle (unprompted,
 * open-but-quiet, or a session the user is watching).
 * @param summary - the sessions list row.
 * @param recentlyDone - monitor-tracked running→idle transition still within
 * its visibility window: shown green even when the background-completion
 * reminder is not armed (the user was watching, so the product never armed it).
 * @returns the derived tab state.
 */
export declare function sessionTabState(summary: Pick<SessionSummary, 'running' | 'pendingInteraction' | 'completed'>, recentlyDone?: boolean): TabSessionState;
/**
 * Aggregate every listed session into tab counts; idle sessions do not count.
 * @param byId - the sessions list projection's id-to-row map.
 * @param recentlyDone - ids of sessions whose running→idle transition is
 * still within the monitor's visibility window (shown green).
 * @returns per-state counts (never partial: a fresh object per call).
 */
export declare function aggregateTabCounts(byId: Readonly<Record<string, SessionSummary>>, recentlyDone?: ReadonlySet<string>): TabCounts;
/**
 * Whether the counts show nothing to indicate.
 * @param counts - aggregate tab counts.
 * @returns true when every state is zero.
 */
export declare function isEmptyTabCounts(counts: TabCounts): boolean;
//# sourceMappingURL=status.d.ts.map