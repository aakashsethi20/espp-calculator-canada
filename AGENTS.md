# Repository Guidelines

## Project Structure & Module Organization
This repository is a Vite + React + TypeScript app for calculating Canadian ESPP outcomes. Main application code lives in `src/`.

- `src/main.tsx` boots the app.
- `src/App.tsx` composes the page and state flow.
- `src/components/` contains UI components such as `InputPanel.tsx` and `ResultsPanel.tsx`.
- `src/lib/espp.ts` holds the core calculation logic and shared types.
- `src/lib/espp.test.ts` contains unit tests for the calculator engine.
- `public/` stores static assets, `docs/` stores supporting notes, and `dist/` is build output.

## Build, Test, and Development Commands
Use npm with the checked-in lockfile.

- `npm install` installs dependencies.
- `npm run dev` starts the local Vite dev server.
- `npm run build` runs TypeScript compilation and creates a production bundle in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint across the repo.
- `npm test` runs the Vitest suite once.
- `npm run test:watch` runs Vitest in watch mode during development.

## Coding Style & Naming Conventions
Follow the existing TypeScript and React style in `src/`: 2-space indentation, single quotes, and semicolon-free statements. Use `PascalCase` for React components and component filenames, `camelCase` for functions, variables, and props, and keep domain types close to the logic that owns them.

Prefer small presentational components in `src/components/` and keep calculation logic in `src/lib/`. Use Tailwind utility classes in JSX and keep shared styling in `src/index.css`. Run `npm run lint` before opening a PR.

## Testing Guidelines
Vitest is the test runner. Place tests next to the code they cover using the `*.test.ts` pattern. For example, changes to [`src/lib/espp.ts`](/Users/kashsethi/projects/espp-calculator-canada/src/lib/espp.ts) should be accompanied by updates to [`src/lib/espp.test.ts`](/Users/kashsethi/projects/espp-calculator-canada/src/lib/espp.test.ts).

Prioritize regression tests for calculation rules, rounding, and edge cases. Run `npm test` before submitting changes.

## Commit & Pull Request Guidelines
Use Conventional Commits: `feat: add sell-price validation` or `fix: GH-42 correct ROI rounding`. The repo history includes older non-standard messages, but new commits should follow the current convention.

PRs should include a short description, linked issue when available, test evidence, and screenshots for visible UI changes. Keep PRs focused and call out any tax or calculation assumptions that affect outputs.
