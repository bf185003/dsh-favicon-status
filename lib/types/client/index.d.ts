/**
 * Browser tab status indicator: paints the document favicon from the
 * ui-session status snapshot — green done / amber waiting-on-user / blue
 * running — so a backgrounded dsh web tab still shows whether work finished,
 * waits on the user, or is executing. The segmented ring spins clockwise while
 * any session runs; with mixed states the ring splits proportionally (one
 * finished and one running session reads as half green, half blue).
 *
 * The colors default to the GUI's canonical state semantics (the StateDot
 * palette: deepseek blue for ongoing, amber for user attention, green for
 * done) and are overridable through Config, as is the spin period.
 */
import z from '@deepseek-ai/schemastery';
import type { Context as ClientContext } from '@deepseek-ai/cordis';
/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
    /** Full ring rotation period in ms while any session runs (default 1200). */
    spinMs: number;
    /** How long a just-finished session stays shown green, in ms (default 30000). */
    doneVisibleMs: number;
    /** Per-state fill colors (any CSS color accepted by the canvas fill). */
    colors: {
        /** Session actively executing (default the ongoing deepseek blue). */
        running: string;
        /** Session waiting on the user — approval / plan review / question (default amber). */
        pending: string;
        /** Session finished in the background (default green). */
        done: string;
    };
}
export declare const Config: z<Config>;
/** Required service: the ui-session status snapshot (running, pending, completion reminder). */
export declare const inject: string[];
/**
 * Client plugin body: mount the favicon monitor over the ui-session status
 * snapshot.
 * @param ctx - client root context.
 * @param config - validated {@link Config}; schema defaults fill every field.
 */
export declare function apply(ctx: ClientContext, config: Config): void;
//# sourceMappingURL=index.d.ts.map