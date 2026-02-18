# Core — FastAPI Backend

Python 3.12, FastAPI, Uvicorn. Package manager: **uv**.

## Directory structure

```
src/app/
├── main.py              # App setup, CORS config, router includes, /health endpoint
├── config.py            # Config class with env var validation
├── dependencies.py      # Auth dependencies (HTTPBearer, get_current_user_id)
├── models.py            # Pydantic models (User, Release, Playlist, PlaylistTrack, etc.)
├── supabase.py          # Supabase client factory
├── routers/
│   ├── users.py         # User profile endpoints (GET/PATCH /api/users/me)
│   ├── collection.py    # Collection sync/list/detail/tracks endpoints
│   ├── discogs.py       # Discogs OAuth authorize/callback/disconnect
│   └── playlists.py     # Playlist CRUD and track management
└── services/
    ├── collection.py    # CollectionService — sync logic, Discogs data extraction
    ├── discogs.py       # DiscogsService — OAuth flow, state encryption
    └── playlists.py     # PlaylistService — playlist CRUD, track operations
```

## API endpoints

| Method | Path                                   | Description                  |
|--------|----------------------------------------|------------------------------|
| GET    | `/health`                              | Health check (no auth)       |
| GET    | `/api/users/me`                        | Get current user profile     |
| PATCH  | `/api/users/me`                        | Update display name          |
| POST   | `/api/discogs/authorize`               | Initiate Discogs OAuth       |
| POST   | `/api/discogs/callback`                | Complete Discogs OAuth       |
| DELETE | `/api/discogs/disconnect`              | Disconnect Discogs account   |
| POST   | `/api/collection/sync`                 | Sync Discogs collection      |
| GET    | `/api/collection`                      | List releases (paginated)    |
| GET    | `/api/collection/{id}`                 | Get single release           |
| GET    | `/api/collection/{id}/tracks`          | Get release tracks (Discogs) |
| POST   | `/api/playlists`                       | Create playlist              |
| GET    | `/api/playlists`                       | List playlists (paginated)   |
| GET    | `/api/playlists/{id}`                  | Get playlist with tracks     |
| PATCH  | `/api/playlists/{id}`                  | Update playlist              |
| DELETE | `/api/playlists/{id}`                  | Delete playlist              |
| POST   | `/api/playlists/{id}/tracks`           | Add track to playlist        |
| DELETE | `/api/playlists/{id}/tracks/{trackId}` | Remove track from playlist   |
| PATCH  | `/api/playlists/{id}/tracks/reorder`   | Reorder playlist tracks      |

All `/api/*` endpoints require `Authorization: Bearer <jwt-token>` (Supabase JWT).

## Architecture

**Pattern:** Router → Service → Supabase

- **Routers** handle HTTP concerns (request/response, status codes, auth dependency injection).
- **Services** contain business logic (data extraction, OAuth flow, CRUD operations).
- **Supabase client** handles database operations with RLS enforced at DB level.

**Authentication:** `dependencies.py` provides `get_current_user_id` dependency that validates JWT with Supabase and extracts user ID.

**CORS:** Configured for `localhost:3000` and `localhost:3001` (configurable via env).

## Key models (models.py)

- **User** — id, email, display_name, avatar_url, discogs_username, discogs_connected_at, timestamps
- **Release** — 20+ fields including discogs_metadata (JSONB)
- **Playlist** — id, user_id, name, description, tags, timestamps
- **PlaylistTrack** — snapshot data (title, artist, duration, position, track_order, cover_image_url)
- **PlaylistWithTracks** — Playlist + tracks list + total_duration

## Environment variables

Create `core/.env` (git-ignored, use `.env.example` as template):

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
DISCOGS_CONSUMER_KEY=<from discogs.com/settings/developers>
DISCOGS_CONSUMER_SECRET=<from discogs.com/settings/developers>
DISCOGS_USER_AGENT=Bookshelf/0.1.0
STATE_ENCRYPTION_KEY=<64-char-hex: python -c "import secrets; print(secrets.token_hex(32))">
```

## Testing

**Stack:** pytest + pytest-asyncio + pytest-cov.

```sh
uv run pytest              # Run all tests
uv run pytest --cov        # With coverage
```

**Test location:** `core/tests/` directory (not co-located).

**Test files:** `test_main.py`, `test_users.py`, `test_collection.py`, `test_discogs.py`, `test_playlists.py`, `test_service_*.py`, `test_models.py`.

**Fixtures:** `conftest.py` provides `client` (TestClient), `mock_supabase_user`, env setup.

**Conventions:**
- Mock Supabase and Discogs clients in tests
- Test file naming: `test_module_name.py`
- Test both routers (HTTP layer) and services (business logic)

## Code style

Ruff: double quotes, 4-space indent, 88-char line length.
Lint rules: E, F, W, I, UP, B, SIM, N.

```sh
uv run ruff check src/     # Lint
uv run ruff format src/    # Format
```
