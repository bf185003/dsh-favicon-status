# @deepseek-ai/dsh-client-ui-favicon-status

English | [中文](README.zh.md)

Browser tab status indicator: paints the document favicon from the sessions list projection so a backgrounded dsh web tab still shows whether work finished, waits on the user, or is executing.

## Install

```sh
dsh plugin --profile web add git+https://github.com/bf185003/dsh-favicon-status.git
```

Restart `dsh web` afterwards: adding the plugin changes the profile's bundle roster, which the running server only picks up on restart. The plugin is browser-only; the node half exists solely so the plugin appears in the Loader tree.

## Behavior

The favicon becomes a segmented ring whose wedges are proportional to the session counts per state, using the GUI's canonical state semantics (the sidebar StateDot palette): blue for sessions actively executing, amber for sessions waiting on the user (approval / plan review / question), green for sessions that finished. The document's original favicon graphic (the whale) is drawn inside the ring hole once it loads, so the tab keeps its identity while indicating. While any session runs, the ring rotates clockwise around a fixed trailing gap of at least 30°, so even a single-color ring shows an anchor that makes the spin visible at 16 px in a backgrounded tab; when nothing runs the ring is a complete circle — the gap exists to show rotation, and a static done or waiting ring needs no anchor. With mixed states the ring splits proportionally: one finished and one running session reads as half green, half blue, and the wedge order is fixed (running, pending, done) so the mix is legible rather than shuffled. When no session is in any of the three states, the original favicon is restored.

State precedence per session matches the sidebar: a pending interaction outranks live activity, which outranks the done states. Green covers the sidebar's "finished in the background" reminder (a session that finished while unselected and unopened, cleared by opening it) and any session whose running-to-idle transition the monitor just observed: even when the product never armed the reminder because the user was watching, the tab shows green for the configured `doneVisibleMs` window (default 30 s) before falling back. The window is a background hint only: while any session runs it does not participate in the counts (live activity owns the tab, blue and spinning), and returning to the page — the tab becoming visible — clears it immediately. Subagent catalog rows reach the list projection with their own running bit, so delegated work colors the tab too.

The animation is time-based (`Date.now()` modulo the spin period): each timer tick repaints at the rotation the wall clock says, so a throttled background tab still advances the spin on every allowed tick. The timer runs while at least one session runs or a done window is still open, and stops when neither remains; fiber teardown restores the original favicon (HMR safety). The ring is painted on a 64 px canvas, so the browser's downscale to the 16 px tab bar keeps the gap and the color boundaries crisp.

Colors, the spin period, and the done-visibility window are validated [Config](src/client/index.ts) fields, overridable from the deployment's cordis.yml.

## Development

The source lives in the [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) monorepo at `packages/client/ui-favicon-status`; this repository publishes the package as built there, so `lib/` contains the build artifacts and the browser bundle. To rebuild, run the monorepo's `pnpm --filter @deepseek-ai/dsh-client-ui-favicon-status run bundle` and sync the resulting `lib/` here.

## Model Experience

None, as this package paints a browser chrome element from the sessions list projection and touches no prompt, message, schema, stream, or tool result.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **Background-tab throttling coarsens the spin.** Browsers throttle `setInterval` in hidden tabs (Chrome to 1 Hz, with intensive throttling to once per minute after about five minutes of chained timers), so the rotation advances in steps rather than smoothly while the tab is backgrounded; the time-based phase keeps the direction and pace correct. Browsers do not animate SVG favicons, which is why the animation is JS-driven at all.
- **The indicator reflects the session list summary, not per-job detail.** It aggregates the same `running` / `pendingInteraction` / `completed` fields the sidebar dots use, plus a monitor-local transition window for just-finished sessions; background job rows and workflow phases are not surfaced individually.
- **The done window is a tab-only reminder.** `doneVisibleMs` shows green after a running-to-idle transition even when the sidebar never armed its background-completion reminder (the user was watching); the sidebar itself keeps its own semantics. The window lives only while the tab stays backgrounded: becoming visible clears it, and any running session takes the tab over (blue, spinning) until it quiets.
- **One favicon link.** The monitor swaps the document's first `rel~="icon"` link (creating one when absent) and restores it on dispose; multi-icon manifests and `apple-touch-icon` are not enumerated.
