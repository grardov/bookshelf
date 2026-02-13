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
make test             # Run all tests (core + web)
make test-watch       # Run web tests in watch mode
make test-coverage    # Run tests with coverage reports
make release          # Bump version, update CHANGELOG, commit, tag
make release-first    # First release (no version bump)
```

## API endpoints (core)

| Method | Path                      | Description                | Auth Required |
|--------|---------------------------|----------------------------|---------------|
| GET    | `/health`                 | Health check               | No            |
| GET    | `/api/users/me`           | Get current user profile   | Yes (JWT)     |
| PATCH  | `/api/users/me`           | Update display name        | Yes (JWT)     |
| POST   | `/api/discogs/authorize`  | Initiate Discogs OAuth     | Yes (JWT)     |
| POST   | `/api/discogs/callback`   | Complete Discogs OAuth     | Yes (JWT)     |
| DELETE | `/api/discogs/disconnect` | Disconnect Discogs account | Yes (JWT)     |
| POST   | `/api/collection/sync`    | Sync Discogs collection    | Yes (JWT)     |
| GET    | `/api/collection`         | List releases (paginated)  | Yes (JWT)     |
| GET    | `/api/collection/{id}`    | Get single release         | Yes (JWT)     |

### Authentication

All `/api/*` endpoints require a valid Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

The JWT token is obtained from the Supabase session on the frontend (`session.access_token`).

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

Database schema includes:
- `public.users` table extending `auth.users` with profile data and Discogs integration fields
- `public.releases` table storing user's synced Discogs collection
- Row Level Security (RLS) policies for user data access
- Triggers for automatic profile creation and timestamp updates

## Environment Variables

### Backend (core)

Create `core/.env` with Supabase and Discogs credentials:

```bash
# Supabase (required)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>

# Discogs OAuth 1.0a (optional, for collection sync)
DISCOGS_CONSUMER_KEY=<from discogs.com/settings/developers>
DISCOGS_CONSUMER_SECRET=<from discogs.com/settings/developers>
DISCOGS_USER_AGENT=Bookshelf/0.1.0
STATE_ENCRYPTION_KEY=<64-char-hex: python -c "import secrets; print(secrets.token_hex(32))">
```

Get Supabase credentials from `supabase status` after running `supabase start` in the `db/` directory.
Get Discogs credentials from https://www.discogs.com/settings/developers (register a new app).

### Frontend (web)

`web/.env.local` (already configured):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_CORE_API_URL=http://localhost:8000
```

**Note:** `.env` files are git-ignored. Use `.env.example` files as templates.

## Testing

### Web (Vitest + React Testing Library)

```sh
pnpm --filter web test          # Run all tests
pnpm --filter web test:watch    # Watch mode
pnpm --filter web test:ui       # Vitest UI
pnpm --filter web test:coverage # Coverage report
```

**Test location:** Co-located with source files in component folders (`component-name/component-name.test.tsx`)

**Test utilities:** `web/tests/` contains:
- `setup.ts` - Global test configuration
- `utils/render-with-providers.tsx` - Custom render with AuthProvider
- `mocks/` - Mock factories for Supabase, Next.js navigation, etc.
- `fixtures/` - Test data fixtures (users, profiles)

**Component structure:**
```
components/component-name/
├── index.tsx                 # Barrel export
├── component-name.tsx        # Implementation
└── component-name.test.tsx   # Tests
```

### Core (pytest)

```sh
cd core && uv run pytest         # Run all tests
cd core && uv run pytest --cov   # With coverage
```

**Test location:** `core/tests/` directory

**Fixtures:** `conftest.py` provides FastAPI test client and common fixtures

### Running All Tests

```sh
make test              # Run all tests (core + web)
make test-watch        # Watch mode (web only)
make test-coverage     # With coverage reports
```

### Testing Conventions

1. **Always add tests with new features** - Tests accompany code, not as an afterthought
2. **Test file naming:**
   - Web: `component-name.test.tsx` (co-located in component folder)
   - Core: `test_module_name.py` (in tests/ directory)
3. **Mock external dependencies:** Supabase, Next.js navigation, etc.
4. **Focus on critical paths:** Auth, data mutations, business logic
5. **Test behavior, not implementation:** Query by user-facing attributes (roles, labels, text)
6. **Use descriptive test names:** "it redirects to login when accessing protected route without auth"

### Current Test Coverage

- **Web:** 32 tests covering auth infrastructure, middleware, routing, Supabase clients, UI components
- **Core:** 31 tests covering health endpoint, user profile API (GET/PATCH), Discogs OAuth endpoints, and Collection API (sync, list, get)

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
