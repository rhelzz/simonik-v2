# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Laravel 13 (PHP 8.3) + Inertia.js v2 + React 19 + Tailwind CSS v4, built with Vite. SQLite database. This is based on `laravel/blank-react-starter-kit`. The React Compiler is enabled (`babel-plugin-react-compiler` in `vite.config.ts`), so avoid manual `useMemo`/`useCallback` micro-optimizations.

## Commands

Run on Windows under Laragon; `php`/`composer`/`npm` are on PATH.

- `composer dev` — run the full dev stack concurrently: `php artisan serve`, `queue:listen`, and `npm run dev` (Vite). This is the normal way to develop.
- `composer test` — the full pre-commit gate: clears config, runs `pint --test` (lint), `phpstan` (types), then `php artisan test`. Use this before considering work done.
- `composer ci:check` — same checks the CI runs, plus JS lint/format/types (`eslint`, `prettier --check`, `tsc --noEmit`).
- `composer lint` / `composer lint:check` — Pint (PHP formatter) write / check-only.
- `npm run lint` / `npm run format` / `npm run types:check` — ESLint (`--fix`), Prettier, and `tsc --noEmit` for the frontend.
- `php artisan test` — run the PHPUnit suite. Single file/filter: `php artisan test tests/Feature/ExampleTest.php` or `php artisan test --filter=testName`.
- `php artisan migrate` — apply migrations against `database/database.sqlite`.

CI: `.github/workflows/tests.yml` runs the test suite; `.github/workflows/lint.yml` runs Pint + Prettier + ESLint.

## Architecture

### Inertia bridge (no separate API)
The backend and frontend are coupled through Inertia, not a REST/JSON API. Controllers return `Inertia::render('page-name', [...props])` (or `Route::inertia(...)` for static pages, see `routes/web.php`). Props are received directly as React component props in the matching file under `resources/js/pages/`. Globally shared props (auth user, app name) are defined in `app/Http/Middleware/HandleInertiaRequests.php::share()` and are available on every page.

The React entry point is `resources/js/app.tsx`. Pages live in `resources/js/pages/` and are resolved by name.

### Wayfinder — generated, do not hand-edit
`laravel/wayfinder` + `@laravel/vite-plugin-wayfinder` generate typed TypeScript route/action helpers from the PHP routes and controllers. These directories are **generated output** and should not be edited by hand:

- `resources/js/routes/`
- `resources/js/actions/`
- `resources/js/wayfinder/`

When you add or change Laravel routes/controllers, regenerate these (the Vite plugin does it during `npm run dev`/`build`; `php artisan wayfinder:generate` runs it manually). Import route/action helpers from `@/routes` and `@/actions` rather than hardcoding URLs.

### Path alias
`@/*` maps to `resources/js/*` (see `tsconfig.json`). Use it for all frontend imports.

## Testing notes
Tests run against an **in-memory SQLite** database (`phpunit.xml` sets `DB_DATABASE=:memory:`), independent of the on-disk `database/database.sqlite` used in dev. Feature tests go in `tests/Feature/`, unit tests in `tests/Unit/`.

## Laravel Boost (MCP)
`laravel/boost` is installed and exposed as the `laravel-boost` MCP server (`.mcp.json` → `php artisan boost:mcp`). It provides Laravel-aware tools (querying routes, DB, config, docs, Tinker, etc.). Prefer these tools when inspecting the running application's state.
