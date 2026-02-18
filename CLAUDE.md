# Bookshelf

Your personal playlist creator and DJ companion for your Discogs collection.

## Project structure

Monorepo managed with **pnpm workspaces** and **Turborepo**. Each sub-project has its own `CLAUDE.md` with project-specific context.

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

| Layer      | Technology                                                 |
| ---------- | ---------------------------------------------------------- |
| Frontend   | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4         |
| Backend    | FastAPI, Uvicorn, Python 3.12                              |
| Database   | Supabase (PostgreSQL 17, Auth, Storage, Realtime)          |
| Build      | Turborepo, pnpm 9.7.1 workspaces                           |
| Linting    | ESLint 9 + Prettier (web), Ruff (core)                     |
| Git hooks  | Husky 9 + commitlint (conventional commits)                |
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
make test             # Run all tests (core + web)
make test-watch       # Run web tests in watch mode
make test-coverage    # Run tests with coverage reports
make release          # Bump version, update CHANGELOG, commit, tag
make release-first    # First release (no version bump)
make config-ports     # Update Supabase ports in config.toml
make ports            # Show current port configuration
```

### Custom ports

Default ports: core=8000, web=3000, Supabase API=54321, DB=54322, Studio=54323.

Override at invocation: `make dev CORE_PORT=8001 WEB_PORT=3001`

Or persist overrides in `.ports.mk` (git-ignored):

```makefile
CORE_PORT=8001  WEB_PORT=3001  SB_API_PORT=55321  SB_DB_PORT=55322  SB_STUDIO_PORT=55323
```

After changing Supabase ports: `make config-ports` then update `.env` files.

## Commit conventions

Enforced by husky + commitlint (`@commitlint/config-conventional`).

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`.
Scopes: `web`, `core`, `db`.

## Versioning and releases

Single version across the entire monorepo. Root `package.json` is source of truth.
`commit-and-tag-version` syncs to: `package.json`, `web/package.json`, `core/pyproject.toml`.
Tags use `v` prefix (e.g., `v0.2.0`).

## Code style

- **Web**: Prettier (semi, double quotes, 2-space indent, trailing commas). ESLint 9 flat config.
- **Core**: Ruff (double quotes, 4-space indent, 88 char line length). Rules: E, F, W, I, UP, B, SIM, N.
- **EditorConfig**: 2-space indent (default), 4-space for `.py`, tabs for `Makefile`. LF, UTF-8.

---

## Rules for Claude

1. **Keep CLAUDE.md files up-to-date.** After any commit that changes project structure, dependencies, API endpoints, commands, conventions, or tooling, update the relevant CLAUDE.md in the same commit.
2. Follow conventional commits. Never create commits without a valid `type(scope): description` format.
3. Use `pnpm` for JS dependencies and `uv` for Python dependencies. Never mix them.
4. Prefer editing existing files over creating new ones.
5. Run `make lint` before committing to catch issues early.
6. Do not commit `.env` files, credentials, or secrets.
7. When adding new API endpoints to `core/`, update the endpoints table in `core/CLAUDE.md`.
8. When adding new make targets, update the "Key commands" section above.
9. When adding new packages to the monorepo, update the "Project structure" section above.
10. Always add tests with new features. Tests accompany code, not as an afterthought.
11. Always run `make format` to format the code correctly based on the rules already set.
