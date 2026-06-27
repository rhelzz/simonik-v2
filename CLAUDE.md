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

## Testing notes (Optional when me asked to test)
Tests run against an **MySQL** database (`phpunit.xml` sets `DB_DATABASE=:memory:`), independent of the on-disk `database/database.sqlite` used in dev. Feature tests go in `tests/Feature/`, unit tests in `tests/Unit/`. **This project uses PHPUnit, not Pest** — create tests with `php artisan make:test --phpunit {name}` and write them as PHPUnit classes (convert any Pest-style test you encounter). Run a single test with `php artisan test --filter=testName` and prefer `--compact` output; cover happy paths, failure paths, and edge cases. Don't delete existing tests without approval.

## Laravel Boost (MCP)
`laravel/boost` is installed and exposed as the `laravel-boost` MCP server (`.mcp.json` → `php artisan boost:mcp`). It provides Laravel-aware tools (querying routes, DB, config, docs, Tinker, etc.). Prefer these tools when inspecting the running application's state. In particular, use Boost's documentation-search tool to fetch version-specific docs for the packages in this repo rather than relying on memory.

## Best practices

These are distilled from the Laravel Boost guidelines bundled with this project (`vendor/laravel/boost/.ai/**`, including the `laravel-best-practices`, `inertia-react-development`, `wayfinder-development`, and `tailwindcss-development` skills). Use Boost's `search-docs` tool for version-specific examples before writing non-trivial code.

### PHP 8.3 / Laravel 13
- **Use Artisan generators** (`make:controller`, `make:model -mf`, `make:request`, etc.) instead of hand-writing boilerplate — they match the version's expected structure.
- **Type everything** and use **constructor property promotion** (`public function __construct(private OrderService $service) {}`). Add explicit return types and parameter type hints; document arrays with PHPDoc array shapes (`array<int, User>`), not bare `array`. PHPStan/Larastan (`phpstan.neon`) runs in `composer test`, so run `composer types:check` before finishing.
- Always use **curly braces** for control structures; prefer PHPDoc blocks over inline comments; use TitleCase for enum cases.
- **Inject dependencies via the constructor** — avoid `app()`/`resolve()` inside classes. Extract discrete business operations into single-purpose action classes; depend on interfaces at system boundaries (gateways, external APIs).
- Use `mb_*` string functions (or `Str::` helpers) for UTF-8 safety; `defer(fn () => ...)` for fire-and-forget post-response work; `Context` for request-scoped data that should reach jobs/logs.

### Eloquent & database
- Give relationships **explicit return types** (`HasMany`, `BelongsTo`, …) and follow convention over configuration (don't set `$table`/`$primaryKey`/pivot names when defaults work).
- Extract reusable constraints into **local scopes**; apply **global scopes sparingly** (soft-deletes/tenancy only).
- Define **`casts()`** for booleans, arrays, decimals, and all date columns (use the Carbon instance, don't re-parse strings).
- Prefer Eloquent/relationships over `DB::table()`; use `whereBelongsTo($user)` instead of manual foreign keys; **never hardcode table names** in queries (use `(new Model)->getTable()`) — except in migrations, where literal names are correct.
- **Eager-load** (`with()`) on any query feeding an Inertia page to avoid N+1. Always specify an order before paginating (`Post::latest()->paginate()`) — row order is otherwise undefined.
- **Migrations are forward-only here** — add a new migration to change schema, don't edit committed ones. Use factories/seeders for test and demo data.

### Validation & config
- **Validate in Form Request classes**, not inline in controllers. Always persist with `$request->validated()`, never `$request->all()`. Prefer array rule notation (`['required', 'email', Rule::unique('users')]`) but match an existing Form Request's style. Use the `after()` method for multi-field custom validation.
- **Never call `env()` outside `config/*.php`** — config is cached in production, so `env()` elsewhere returns null. Read config via `config()`.

### Inertia v2 + React 19
- **Pass data as page props from controllers** (`Inertia::render`), not via separate fetch/axios calls — a page is a function of its props. Share cross-cutting data once in `HandleInertiaRequests::share()` (already holds `auth.user`); read it with `usePage().props`.
- **Navigate with Inertia**, never `<a href>` or `window.location`: use `<Link>` and `router.visit/post/...` from `@inertiajs/react`. Add `prefetch` to links for perceived speed.
- **Build forms with the `<Form>` component** (or `useForm` for programmatic control) — both handle CSRF, the `errors` object, and `processing` automatically. Surface server validation errors; don't re-implement all rules on the client.
- This is Inertia v2+, so use **deferred props** (always render a pulsing/skeleton empty state for the `undefined` phase), `WhenVisible` for infinite scroll, `usePoll` for polling, and partial reloads (`only: [...]`) for expensive props.

### Wayfinder
- Call backend routes through Wayfinder helpers, **never hardcoded URLs**. Use **named imports** (not default imports) so tree-shaking works: `import { show, store } from '@/actions/...'` / `import { show } from '@/routes/...'`.
- Helpers expose `.url()`, `.get()/.post()/.patch()/.delete()`, `.form()` (for `<Form {...store.form()}>`), and query params via `show(1, { query: { page: 1 } })`. **Regenerate after route/controller changes** — the Vite plugin does it on `npm run dev`/`build`, or run `php artisan wayfinder:generate` (add `--with-form` for form helpers).

### React / TypeScript / Tailwind v4
- **The React Compiler is on** — don't add manual `useMemo`/`useCallback`/`React.memo`; write plain, pure components and let the compiler optimize.
- **No `any`** (`npm run types:check` is in the CI gate). Type page props explicitly; reuse shared types from `@/types`. Import via the `@/` alias, never `../../..`.
- **Tailwind v4 is CSS-first**: theme lives in `resources/css/app.css` via `@theme` and `@import "tailwindcss"` — there is no `tailwind.config.js`. Avoid removed v3 utilities (`bg-opacity-*` → `bg-black/50`, `flex-shrink-*` → `shrink-*`, etc.), use `gap-*` for spacing between siblings rather than margins, and match the project's dark-mode approach if present.
- Merge conditional classes with the `cn()` helper in `@/lib/utils` (clsx + tailwind-merge); let **Prettier** (with the Tailwind class-sorting plugin) own formatting via `npm run format` — don't reorder classes by hand.

### Workflow before finishing
- If you touched PHP, run `vendor/bin/pint --dirty` to auto-format (don't fix style manually, and don't use `--test` to "check only" — just let it fix).
- Run the affected test(s) with `php artisan test --filter=...`, then offer to run the full suite.
- Run the full gate that CI enforces: `composer ci:check` (PHP lint + Prettier + `tsc` + tests), or the pieces individually (`composer test`, `npm run lint`, `npm run types:check`).
