# Changelog

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
