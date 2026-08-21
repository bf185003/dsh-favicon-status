/**
 * Browser tab status indicator: paints the document favicon from the sessions
 * list projection 鈥?green done / amber waiting-on-user / blue running 鈥?so a
 * backgrounded dsh web tab still shows whether work finished, waits on the
 * user, or is executing. The segmented ring spins clockwise while any session
 * runs; with mixed states the ring splits proportionally (one finished and
 * one running session reads as half green, half blue).
 *
 * The colors default to the GUI's canonical state semantics (the StateDot
 * palette: deepseek blue for ongoing, amber for user attention, green for
 * done) and are overridable through Config, as is the spin period.
 */
import z from '@deepseek-ai/schemastery'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createCanvasRenderer, type FaviconPalette } from './favicon.ts'
import { createTabStatusMonitor } from './monitor.ts'

/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
  /** Full ring rotation period in ms while any session runs (default 1200). */
  spinMs: number
  /** How long a just-finished session stays shown green, in ms (default 30000). */
  doneVisibleMs: number
  /** Per-state fill colors (any CSS color accepted by the canvas fill). */
  colors: {
    /** Session actively executing (default the ongoing deepseek blue). */
    running: string
    /** Session waiting on the user 鈥?approval / plan review / question (default amber). */
    pending: string
    /** Session finished in the background (default green). */
    done: string
  }
}

/** Default fill colors: the GUI's canonical state palette (StateDot semantics). */
const DEFAULT_PALETTE = { running: '#5686FE', pending: '#F59E0B', done: '#22C55E' }

export const Config: z<Config> = z.object({
  spinMs: z.number().step(1).min(200).default(1200),
  doneVisibleMs: z.number().step(1).min(1000).default(30_000),
  colors: z.object({
    running: z.string().default(DEFAULT_PALETTE.running),
    pending: z.string().default(DEFAULT_PALETTE.pending),
    done: z.string().default(DEFAULT_PALETTE.done),
  }).default(DEFAULT_PALETTE),
})

/** Required services: the sessions list projection. */
export const inject = ['sessions']

/**
 * Client plugin body: mount the favicon monitor over the sessions list.
 * @param ctx - client root context.
 * @param config - validated {@link Config}; schema defaults fill every field.
 */
export function apply(ctx: ClientContext, config: Config): void {
  const palette: FaviconPalette = {
    running: config.colors.running,
    pending: config.colors.pending,
    done: config.colors.done,
  }
  ctx.effect(() => {
    const renderer = createCanvasRenderer(document, palette)
    const monitor = createTabStatusMonitor(document, ctx.sessions.list, renderer, {
      spinMs: config.spinMs,
      doneVisibleMs: config.doneVisibleMs,
    })
    return () => { monitor.dispose() }
  }, 'ui-favicon-status: session favicon')
}
