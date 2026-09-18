# dsh-favicon-status

English | [中文](README.zh.md)

## Summary

The favicon of a backgrounded dsh web tab reports what the workspace is doing: a segmented ring drawn in the GUI's state colors — blue for sessions executing, amber for sessions waiting on the user, green for sessions that finished in the background. The ring spins while any session runs and splits proportionally when states mix; the document's own icon stays in the middle. Every state comes from the kernel's ui-session status snapshot. Install it as a dsh web profile plugin: there is no host half and no model-facing surface.

## Install

```sh
dsh plugin --profile web add dsh-favicon-status
```

Restart `dsh web` afterwards: adding the plugin changes the profile's bundle roster, which the running server only picks up on restart. The plugin is browser-only; the node half exists solely so the plugin appears in the Loader tree. Requires the DSH web client at **0.1.6-alpha.2 or later** — the client half subscribes to the kernel's per-session status snapshot (`ctx.uiSession.sessionStatus`), which carries `running`, the effective `pendingInteraction`, and the `completionUnread` reminder in one map. Earlier kernels split those facts across the sessions list and a separate pending-interaction snapshot (0.1.5-alpha), or shipped them under the retired `@deepseek-ai/dsh-client-runtime` package, and need an earlier plugin release.

## Behavior

| Running (spinning) | Waiting on the user | Finished |
| :---: | :---: | :---: |
| ![running](assets/running.png) | ![pending](assets/pending.png) | ![done](assets/done.png) |

The favicon becomes a segmented ring whose wedges are proportional to the session counts per state, using the GUI's canonical state semantics (the sidebar StateDot palette): blue for sessions actively executing, amber for sessions waiting on the user (approval / plan review / question), green for sessions that finished. The document's original favicon graphic (the whale) is drawn inside the ring hole once it loads, so the tab keeps its identity while indicating. While any session runs, the ring rotates clockwise around a fixed trailing gap of at least 30°, so even a single-color ring shows an anchor that makes the spin visible at 16 px in a backgrounded tab; when nothing runs the ring is a complete circle — the gap exists to show rotation, and a static done or waiting ring needs no anchor. With mixed states the ring splits proportionally — a running session beside one waiting on the user reads as part blue, part amber — and the wedge order is fixed (running, pending, done) so the mix is legible rather than shuffled. Green never mixes into a ring that has a running wedge: a background completion reminder is dropped from the counts while any session executes, so a running task cannot read as partly finished. When no session is in any of the three states, the original favicon is restored.

State precedence per session matches the sidebar: a pending interaction outranks live activity, which outranks the done states. Green covers the kernel's "finished in the background" reminder (`completionUnread`: a session that stopped while the user was looking elsewhere in the UI) and any session whose running-to-idle transition the monitor just observed: even when the kernel never armed the reminder because the user was watching, the tab shows green for the configured `doneVisibleMs` window (default 30 s) before falling back. Both kinds of green are dropped while any session runs, so live activity owns the tab (blue, spinning) and a running task never paints partly green; the window also does not survive the tab becoming visible, which clears it immediately. Subagent sessions reach the status snapshot with their own running bit, so delegated work colors the tab too.

The animation is time-based (`Date.now()` modulo the spin period): each timer tick repaints at the rotation the wall clock says, so a throttled background tab still advances the spin on every allowed tick. The timer runs while at least one session runs or a done window is still open, and stops when neither remains; fiber teardown restores the original favicon (HMR safety). The ring is painted on a 64 px canvas, so the browser's downscale to the 16 px tab bar keeps the gap and the color boundaries crisp.

Colors, the spin period, and the done-visibility window are validated [Config](src/client/index.ts) fields, overridable from the deployment's cordis.yml.

## Development

This is an independent community plugin: it is developed and published from this repository and is **not** part of the official [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) monorepo. Its UI language follows the dsh web GUI's canonical state semantics (the sidebar StateDot palette), which is a deliberate reference to the official look — not official code. `lib/` contains the build artifacts and the browser bundle; `pnpm install && pnpm test` runs the unit suite locally.

## Model Experience

None, as this package paints a browser chrome element from the ui-session status snapshot and touches no prompt, message, schema, stream, or tool result.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **Background-tab throttling coarsens the spin.** Browsers throttle `setInterval` in hidden tabs (Chrome to 1 Hz, with intensive throttling to once per minute after about five minutes of chained timers), so the rotation advances in steps rather than smoothly while the tab is backgrounded; the time-based phase keeps the direction and pace correct. Browsers do not animate SVG favicons, which is why the animation is JS-driven at all.
- **The indicator reflects the per-session status snapshot, not per-job detail.** It aggregates the kernel's `running` / `pendingInteraction` / `completionUnread` facts published by `ctx.uiSession.sessionStatus`, plus a monitor-local transition window for just-finished sessions; background job rows and workflow phases are not surfaced individually.
- **The done window is a tab-only reminder.** `doneVisibleMs` shows green after a running-to-idle transition even when the kernel never armed its background-completion reminder (the user was watching); the sidebar itself keeps its own semantics. The window lives only while the tab stays backgrounded: becoming visible clears it, and any running session takes the tab over (blue, spinning) until it quiets.
- **One favicon link.** The monitor swaps the document's first `rel~="icon"` link (creating one when absent) and restores it on dispose; multi-icon manifests and `apple-touch-icon` are not enumerated.
