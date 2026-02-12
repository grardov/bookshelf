# Bookshelf

Your personal playlist creator and DJ companion for your Discogs collection.

## Project structure

This is a monorepo managed with **pnpm workspaces** and **Turborepo**.

```
bookshelf/
├── web/          # Next.js 16 frontend (React 19, TypeScript, Tailwind CSS 4)
├── core/         # FastAPI backend (Python 3.12, uvicorn)
├── db/           # Supabase (PostgreSQL 17) — config, migrations, seeds
├── scripts/      # Build/release helpers (toml-updater.js)
├── .husky/       # Git hooks (commit-msg → commitlint)
├── Makefile      # Root convenience targets
├── turbo.json    # Turborepo task definitions
└── package.json  # Root workspace — single source of truth for version (0.1.0)
```

## Tech stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend    | FastAPI, Uvicorn, Python 3.12                |
| Database   | Supabase (PostgreSQL 17, Auth, Storage, Realtime) |
| Build      | Turborepo, pnpm 9.7.1 workspaces            |
| Linting    | ESLint 9 + Prettier (web), Ruff (core)      |
| Git hooks  | Husky 9 + commitlint (conventional commits) |
| Versioning | commit-and-tag-version, single version across all packages |

## Package managers

- **pnpm** for JavaScript/TypeScript (`web/` is the only pnpm workspace package).
- **uv** for Python (`core/` uses `uv sync` and `uv run`).
- Always use `-w` flag when adding root-level JS dependencies: `pnpm add -wD <pkg>`.

## Key commands

```sh
make install          # pnpm install + uv sync
make dev              # Run core + web in parallel
make build            # Turbo build
make lint             # Ruff (core) + ESLint (web)
make format           # Ruff format (core) + Prettier (web)
make check            # Check formatting without writing
make test             # pytest (core)
make release          # Bump version, update CHANGELOG, commit, tag
make release-first    # First release (no version bump)
```

## API endpoints (core)

| Method | Path      | Description   |
|--------|-----------|---------------|
| GET    | `/health` | Health check  |

## Database

Supabase local development stack:

```sh
cd db && supabase start       # Start local Supabase (requires Docker)
supabase migration new <name> # Create a new migration
supabase db reset             # Apply all migrations + seed.sql
```

- **API**: http://localhost:54321
- **Studio**: http://localhost:54323
- **Inbucket** (email testing): http://localhost:54324

No migrations or schema defined yet — `db/supabase/seed.sql` is empty.

## Code style

- **Web**: Prettier (semi, double quotes, 2-space indent, trailing commas). ESLint 9 flat config with Next.js + Prettier rules.
- **Core**: Ruff (double quotes, 4-space indent, 88 char line length). Lint rules: E, F, W, I, UP, B, SIM, N.
- **EditorConfig**: 2-space indent (default), 4-space for `.py`, tabs for `Makefile`. LF line endings, UTF-8.

## Commit conventions

Commits are enforced by husky + commitlint using `@commitlint/config-conventional`.

Format: `type(scope): description`

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`.
Common scopes: `web`, `core`, `db`.

Examples:
```
feat(web): add book search page
fix(core): handle empty ISBN in lookup
chore: upgrade dependencies
docs: update API endpoint table in CLAUDE.md
```

## Versioning and releases

Single version across the entire monorepo. The root `package.json` is the source of truth.
On release, `commit-and-tag-version` syncs the version to:
- `package.json` (root)
- `web/package.json`
- `core/pyproject.toml` (via `scripts/toml-updater.js`)

Tags use `v` prefix (e.g., `v0.2.0`).

## Current state

Early-stage scaffold (v0.1.0). Infrastructure is fully set up. No application features implemented yet — web has a placeholder Next.js page, core has only a health endpoint, and db has no schema.

---

## Rules for Claude

1. **Keep CLAUDE.md up-to-date.** After any commit that changes project structure, dependencies, API endpoints, commands, conventions, or tooling, update the relevant sections of this file in the same commit. This is the single source of truth for project context.
2. Follow conventional commits. Never create commits without a valid `type(scope): description` format.
3. Use `pnpm` for JS dependencies and `uv` for Python dependencies. Never mix them.
4. Prefer editing existing files over creating new ones.
5. Run `make lint` before committing to catch issues early.
6. Do not commit `.env` files, credentials, or secrets.
7. When adding new API endpoints to `core/`, update the "API endpoints" table above.
8. When adding new make targets, update the "Key commands" section above.
9. When adding new packages to the monorepo, update the "Project structure" section above.
