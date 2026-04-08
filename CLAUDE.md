# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (Vite)
npm run build        # tsc -b && vite build
npm run test         # run tests once (vitest run)
npm run test:watch   # run tests in watch mode
npm run lint         # eslint
npm run preview      # preview production build
```

Run a single test file:
```bash
npx vitest run src/lib/espp.test.ts
```

## Architecture

Single-page React 18 + TypeScript app. No router. State lives in `App.tsx` and is passed down as props.

**Planned component tree** (see PLAN.md for full detail):
```
App.tsx              — root layout, holds ESPPInputs state
  InputPanel.tsx     — controlled form, two cards (ESPP Setup / Tax & Sale)
    InputField.tsx   — reusable labeled input
  ResultsPanel.tsx   — three sections (Purchase Summary / Tax Breakdown / Net Result)
```

**Calculation engine:** `src/lib/espp.ts` — pure functions, no UI dependencies. `calculateESPP(inputs: ESPPInputs): ESPPResults`. Covered by 26 Vitest tests in `src/lib/espp.test.ts`.

## Tailwind CSS v4

Uses `@tailwindcss/vite` plugin — no `tailwind.config.ts`. Custom colors are defined with `@theme` in `src/index.css` and map directly to utility classes:

| CSS variable        | Utility class        |
|---------------------|----------------------|
| `--color-surface`   | `bg-surface`         |
| `--color-surface-alt` | `bg-surface-alt`   |
| `--color-card`      | `bg-card`            |
| `--color-accent`    | `bg-accent` / `text-accent` |
| `--color-accent-dark` | `bg-accent-dark`   |
| `--color-muted`     | `text-muted`         |
| `--color-error`     | `text-error`         |

Body text uses Tailwind built-in `text-neutral-200` (not a custom variable — `--color-text` would clash with Tailwind internals).

## Key conventions

- Commit messages: short and concise, no `Co-Authored-By` lines
- Step progress tracked in `PLAN.md` (mark steps ✅ when done)
- Steps 1 and 2 are complete; Steps 3–5 remain (InputPanel, ResultsPanel, layout polish)
