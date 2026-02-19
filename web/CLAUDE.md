# Web — Next.js 16 Frontend

React 19, TypeScript 5, Tailwind CSS 4. Path alias: `@/*` → `./src/*`.

## Directory structure

```
src/
├── app/
│   ├── (auth)/                  # Auth route group (login, signup, callback)
│   ├── (app)/                   # Protected route group (layout with sidebar)
│   │   ├── create/              # Home — Discogs search, recent playlists, recently viewed
│   │   ├── collection/          # Collection list; [id] redirects to /release/{discogsId}
│   │   ├── release/[discogsId]/ # Unified release detail (Discogs-cached)
│   │   ├── playlists/           # Playlists list + [id] detail with sortable tracks
│   │   ├── discogs/callback/    # Discogs OAuth callback
│   │   └── settings/            # User settings
│   ├── page.tsx                 # Public landing page
│   └── globals.css              # Tailwind directives
├── components/
│   ├── ui/                      # shadcn/ui components (New York style, lucide icons)
│   ├── auth/                    # Login/signup forms
│   ├── app-header/              # App header with user menu
│   ├── app-sidebar/             # Sidebar navigation
│   ├── mobile-nav/              # Responsive mobile navigation
│   ├── create-playlist-dialog/  # Playlist creation dialog
│   ├── add-to-playlist-dialog/  # Add track to playlist dialog
│   ├── playlist-card/           # Playlist card preview
│   ├── release-card/            # Release card preview (links to /release/{discogsId})
│   ├── search-result-row/       # Discogs search result row
│   ├── track-row/               # Track display row
│   ├── sortable-track-row/      # Draggable track row (dnd-kit)
│   ├── sync-button/             # Collection sync button
│   └── enrichment-badge/        # Metadata enrichment status badge
├── contexts/auth-context/       # Auth state: user, profile, session, signOut, refreshProfile
├── hooks/
│   ├── use-mobile.ts            # Mobile breakpoint detection
│   ├── use-search-history.ts    # Discogs search history (localStorage, max 20)
│   └── use-recently-viewed.ts   # Recently viewed releases (localStorage, max 10)
├── lib/
│   ├── api/                     # Core API client (auto JWT, 401 retry with session refresh)
│   │   ├── client.ts            # Base client with authenticated requests
│   │   ├── collection.ts        # Collection API methods
│   │   ├── playlists.ts         # Playlists API methods
│   │   ├── discogs.ts           # Discogs API methods
│   │   └── users.ts             # Users API methods
│   ├── supabase/                # Supabase clients (browser, server, middleware)
│   ├── metadata.ts              # SEO metadata helpers
│   └── utils.ts                 # Utility functions (cn, etc.)
└── middleware.ts                # Auth middleware (protected + auth route guards)
```

## Key patterns

**Component structure** — barrel export pattern:

```
components/component-name/
├── index.tsx                 # Barrel export
├── component-name.tsx        # Implementation
└── component-name.test.tsx   # Tests (co-located)
```

**Routing** — Next.js App Router with route groups:

- `(auth)` group: login, signup, callback. Redirects authenticated users to `/create`.
- `(app)` group: all protected routes. Redirects unauthenticated users to `/login`.

**Auth** — Supabase Auth with `AuthProvider` context (`contexts/auth-context/`). Provides `user`, `profile`, `session`, `isLoading`, `signOut()`, `refreshProfile()`.

**API client** — `lib/api/client.ts` injects JWT automatically, retries on 401 with session refresh.

**Middleware** — `middleware.ts` refreshes Supabase session on every request. Protected routes: `/create`, `/collection`, `/release`, `/discogs`, `/playlists`, `/settings`.

**Drag & drop** — `@dnd-kit/core` + `@dnd-kit/sortable` for reordering playlist tracks.

**Animations** — Framer Motion.

**UI library** — shadcn/ui (New York style). Add components: `npx shadcn@latest add <component>`.

## Environment variables

`web/.env.local` (git-ignored, use `.env.example` as template):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON=<anon-key>
NEXT_PUBLIC_CORE_API_URL=http://localhost:8000
```

## Testing

**Stack**: Vitest 4 + React Testing Library + happy-dom.

```sh
pnpm --filter web test          # Run all tests
pnpm --filter web test:watch    # Watch mode
pnpm --filter web test:coverage # Coverage report
```

**Test location**: Co-located in component folders (`component-name.test.tsx`).

**Test utilities** (`tests/` directory):

- `setup.ts` — global test config
- `utils/render-with-providers.tsx` — custom render with AuthProvider
- `mocks/` — mock factories for Supabase, Next.js navigation
- `fixtures/` — test data fixtures (users, profiles)

**Conventions**:

- Mock external dependencies (Supabase, Next.js navigation)
- Test behavior, not implementation — query by roles, labels, text
- Descriptive test names: "it redirects to login when accessing protected route without auth"

## Code style

Prettier: semi, double quotes, 2-space indent, trailing commas, 80-char width.
ESLint 9 flat config with Next.js core-web-vitals + TypeScript + Prettier plugin.

---

## Agent skills

Installed in `.agents/skills/` via `vercel-labs/agent-skills`. Rules are loaded automatically from `AGENTS.md` files — do not duplicate them here.

| Skill                         | Purpose                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `vercel-react-best-practices` | 57 React/Next.js performance rules (8 categories)                          |
| `vercel-composition-patterns` | Component architecture: compound components, state lifting, React 19 APIs  |
| `web-design-guidelines`       | UI audit: accessibility, forms, animation, performance, a11y anti-patterns |

Refer to `.agents/skills/<skill>/SKILL.md` for rule indexes and `.agents/skills/<skill>/rules/` for individual rule details.
