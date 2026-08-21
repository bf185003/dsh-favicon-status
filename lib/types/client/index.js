/**
 * Browser tab status indicator: paints the document favicon from the sessions
 * list projection — green done / amber waiting-on-user / blue running — so a
 * backgrounded dsh web tab still shows whether work finished, waits on the
 * user, or is executing. The segmented ring spins clockwise while any session
 * runs; with mixed states the ring splits proportionally (one finished and
 * one running session reads as half green, half blue).
 *
 * The colors default to the GUI's canonical state semantics (the StateDot
 * palette: deepseek blue for ongoing, amber for user attention, green for
 * done) and are overridable through Config, as is the spin period.
 */
import z from '@deepseek-ai/schemastery';
import { createCanvasRenderer } from "./favicon.js";
import { createTabStatusMonitor } from "./monitor.js";
/** Default fill colors: the GUI's canonical state palette (StateDot semantics). */
const DEFAULT_PALETTE = { running: '#5686FE', pending: '#F59E0B', done: '#22C55E' };
export const Config = z.object({
    spinMs: z.number().step(1).min(200).default(1200),
    doneVisibleMs: z.number().step(1).min(1000).default(30_000),
    colors: z.object({
        running: z.string().default(DEFAULT_PALETTE.running),
        pending: z.string().default(DEFAULT_PALETTE.pending),
        done: z.string().default(DEFAULT_PALETTE.done),
    }).default(DEFAULT_PALETTE),
});
/** Required services: the sessions list projection. */
export const inject = ['sessions'];
/**
 * Client plugin body: mount the favicon monitor over the sessions list.
 * @param ctx - client root context.
 * @param config - validated {@link Config}; schema defaults fill every field.
 */
export function apply(ctx, config) {
    const palette = {
        running: config.colors.running,
        pending: config.colors.pending,
        done: config.colors.done,
    };
    ctx.effect(() => {
        const renderer = createCanvasRenderer(document, palette);
        const monitor = createTabStatusMonitor(document, ctx.sessions.list, renderer, {
            spinMs: config.spinMs,
            doneVisibleMs: config.doneVisibleMs,
        });
        return () => { monitor.dispose(); };
    }, 'ui-favicon-status: session favicon');
}
//# sourceMappingURL=index.js.map