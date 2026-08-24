# Contributing

Thanks for considering a contribution! `dsh-favicon-status` is an independent
community plugin, developed and published from this repository. `lib/`
contains the build artifacts — do not edit them by hand.

## Development

```sh
pnpm install
pnpm test        # vitest: the unit suite over status, favicon, monitor, and fiber wiring
```

The specs cover the pure aggregation, the wedge geometry, the DOM/timer
controller, and the cordis fiber wiring (jsdom environment).

## Rebuilding

The browser bundle and types are produced from `src/` with the repo's build
pipeline, then committed into `lib/` together with any source change. Keep the
published payload closed: every relative runtime import and emitted asset must
stay covered by the `files` list in `package.json`. Screenshots in `assets/`
regenerate with `pwsh -File scripts/render-screenshots.ps1`.

## Pull requests

One change per commit, one topic per PR. Update the READMEs (bilingual) and
`CHANGELOG.md` in the same change.
