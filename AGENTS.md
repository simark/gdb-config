# AGENTS.md

## Project shape

This repo is a small static web app that generates `configure` command lines for GDB / binutils-gdb builds.

- `index.html`: the entire UI; Bootstrap is loaded from a CDN and `index.js` is the browser entry point.
- `index.ts`: DOM wiring. It reads every `<input>` in the page, maps `input.id` to `values` / `checked`, applies presets, and refreshes the output textarea.
- `command-builder.ts`: the main source of business logic. It defines presets, option buckets, quoting rules, and the final command string builder.
- `command-builder.test.js`: Node tests for the command-generation logic and presets.

## Source of truth

Prefer editing TypeScript and regenerating JavaScript.

- `command-builder.ts` is the source for `command-builder.js`.
- `index.ts` is the source used to produce the bundled `index.js`.
- `command-builder.js` and `index.js` are generated artifacts that are committed in the repo.

Do not hand-edit generated JavaScript unless the user explicitly asks for it. Make changes in `.ts`, then run the build.

## Important coupling

The UI and command builder are intentionally coupled by string IDs.

- `index.ts` gathers all `<input>` elements and uses each `input.id` as the key in `CommandBuilderInputs`.
- `command-builder.ts` looks up those exact keys in arrays like `configureModeOptions`, `configureFeatureOptions`, `configureValueOptions`, and the preset definitions.
- Preset buttons in `index.html` use `data-preset`, which must stay aligned with the `CommandPresetName` union in `command-builder.ts`.

If you add, rename, or remove an option:

1. Update the relevant `<input id="...">` in `index.html`.
2. Update the matching logic / preset entries in `command-builder.ts`.
3. Update tests in `command-builder.test.js`.

## Build, lint, test

Use the existing npm scripts:

- `npm run build` — runs `tsc` and then bundles `index.ts` with esbuild into `index.js`
- `npm run lint` — runs ESLint plus HTMLHint on `index.html`
- `npm test` — rebuilds and runs the Node test suite
- `npm run format` / `npm run format:check` — Prettier

For code changes, run `npm run lint` and `npm test` before finishing.

## Working conventions

- Keep the app dependency-light and framework-free; the current structure is plain HTML + TypeScript.
- Preserve shell-safe quoting behavior in `command-builder.ts`; it is a core feature, not an implementation detail.
- Favor adding or adjusting tests when changing presets, quoting, flag ordering, or option handling.
- Keep output stable unless the behavior change is intentional; tests assert concrete command strings and regex patterns.
- `index.html` is linted by HTMLHint with simple structural rules (lowercase tags/attrs, unique IDs, quoted attrs, etc.), so keep markup conventional.

## Good change strategy

For most feature work:

1. Change `command-builder.ts` first if behavior or defaults change.
2. Update `index.html` if the UI surface changes.
3. Update `index.ts` only if DOM behavior changes.
4. Regenerate build artifacts with `npm run build`.
5. Update or add tests in `command-builder.test.js`.

## Things to avoid

- Do not introduce a framework or extra tooling unless the task specifically requires it.
- Do not break the `input.id` / builder-key contract.
- Do not leave generated JS stale after changing TypeScript.
