# Contributing

Thanks for considering a contribution! The plugin is developed in the
[deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) monorepo at
`packages/client/ui-favicon-status`; this repository publishes the package as
built there. `lib/` contains the build artifacts — do not edit them by hand.

## Development

```sh
pnpm install
pnpm test        # vitest: the unit suite over status, favicon, monitor, and fiber wiring
```

The specs cover the pure aggregation, the wedge geometry, the DOM/timer
controller, and the cordis fiber wiring (jsdom environment).

## Rebuilding

The browser bundle and types are produced inside the monorepo:

```sh
pnpm --filter @deepseek-ai/dsh-client-ui-favicon-status run bundle
npx tsc -b tsconfig.client.json
```

Then sync the resulting `lib/` here, and update the READMEs (bilingual) and
`CHANGELOG.md` in the same change. Screenshots in `assets/` regenerate with
`pwsh -File scripts/render-screenshots.ps1`.

## Pull requests

One change per commit, one topic per PR. Keep the published payload closed:
every relative runtime import and emitted asset must stay covered by the
`files` list in `package.json`.
