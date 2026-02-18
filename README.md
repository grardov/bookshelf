# Bookshelf

Your personal playlist creator and DJ companion for your Discogs collection.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/) 9.7+
- [Python](https://www.python.org/) 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Docker](https://www.docker.com/) (required for Supabase local dev)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Getting started

```sh
# Clone the repository
git clone <repo-url>
cd bookshelf

# Install all dependencies (JS + Python)
make install

# Start the local Supabase stack (requires Docker running)
cd db && supabase start && cd ..

# Run the full dev environment (API + web in parallel)
make dev
```

The web app will be available at **http://localhost:3000** and the API at **http://localhost:8000**.

## Project structure

```
bookshelf/
├── web/       # Next.js 16 frontend (React 19, TypeScript, Tailwind CSS 4)
├── core/      # FastAPI backend (Python 3.12, Uvicorn)
├── db/        # Supabase config, migrations, and seeds
├── scripts/   # Build and release helpers
└── Makefile   # Root convenience targets
```

## Available commands

| Command              | Description                                    |
| -------------------- | ---------------------------------------------- |
| `make install`       | Install JS (pnpm) and Python (uv) dependencies |
| `make dev`           | Run backend + frontend in parallel             |
| `make build`         | Build all packages via Turborepo               |
| `make lint`          | Lint core (Ruff) and web (ESLint)              |
| `make format`        | Auto-format core (Ruff) and web (Prettier)     |
| `make check`         | Check formatting without writing changes       |
| `make test`          | Run Python tests (pytest)                      |
| `make release`       | Bump version, generate CHANGELOG, commit & tag |
| `make release-first` | Create the first release (no version bump)     |

## Local Supabase

The database runs on [Supabase](https://supabase.com/) (PostgreSQL 17). Start the local stack with Docker:

```sh
cd db
supabase start          # Start all services
supabase migration new <name>  # Create a new migration
supabase db reset       # Re-apply migrations and seed data
supabase stop           # Stop the local stack
```

| Service  | URL                    |
| -------- | ---------------------- |
| API      | http://localhost:54321 |
| Studio   | http://localhost:54323 |
| Inbucket | http://localhost:54324 |

## Commit conventions

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via husky + commitlint.

```
type(scope): description
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`
**Scopes:** `web`, `core`, `db`

```sh
git commit -m "feat(web): add book search page"
git commit -m "fix(core): handle empty ISBN"
```

## Releasing

The monorepo uses a single version across all packages. To cut a release:

```sh
make release          # bumps version, updates CHANGELOG.md, commits, tags
git push --follow-tags
```

## Credits

BPM and key data provided by [GetSongBPM](https://getsongbpm.com).

## License

TBD
