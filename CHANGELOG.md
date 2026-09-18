# Changelog

## 0.1.0-rc.7 (2026-09-12)

- Republish without the UTF-8 BOM on `package.json`: the byte-order mark made
  the manifest unreadable to the dsh profile loader. A package-manifest spec
  now asserts the file is strict JSON with the bundle declaration.

## 0.1.0-rc.6 (2026-09-12)

- Adapt to the current DSH kernel (0.1.5-alpha.1 client): the client half now
  subscribes to the sessions list projection (`ctx.sessions.list`) and the
  effective pending-interaction snapshot (`ctx.uiSession.pendingInteractions`);
  the retired `@deepseek-ai/dsh-client-runtime` types are gone, and the session
  summary's former `pendingInteraction` field is replaced by the ui-session
  map. Pending-interaction changes repaint the tab without a list change.
- Retire the invariant companion and its publication wiring: a pure-presentation
  plugin reserves no ownership relation to observe (matches the upstream
  package-invariant rule that rejects empty installers).

## 0.1.0-rc.5 (2026-08-21)

- Publish as a standalone installable plugin: `dsh.bundle` manifest with a
  `cordis.patch.yml` roster row, build artifacts in `lib/`, npm-resolvable
  peer ranges.
- The green done ring is a background hint only: returning to the page (the
  tab becomes visible) clears it immediately, and while any session runs the
  window does not participate in the counts — live activity owns the tab
  (blue, spinning).
- The ring hole shows the document's original favicon graphic (the whale)
  once it loads; a missing or failed icon leaves the ring hollow.
- The trailing spin gap is at least 30° and exists only while something runs;
  a static done or waiting ring is a complete circle.
