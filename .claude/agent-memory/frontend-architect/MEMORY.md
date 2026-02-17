# Frontend Architect Memory

## Testing Patterns

### Mock Stability for useEffect Dependencies
When mocking `next/navigation`'s `useRouter` or context hooks like `useAuth` in tests for components with `useEffect` that depend on those values, **always use a stable object reference** declared outside the mock factory. Creating new `vi.fn()` instances inside the factory causes the dependency array to detect changes and re-fire the effect on every render.

**Correct:**
```ts
const mockRouter = { push: vi.fn(), replace: vi.fn(), ... };
vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));
```

**Incorrect (causes double effect execution):**
```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), ... })
}));
```

See: `web/src/app/(app)/discogs/callback/page.test.tsx` for the pattern.

### Vitest API Notes
- `SpyInstance` was removed in Vitest 4.x; use `MockInstance` instead.
- `vi.restoreAllMocks()` restores ALL mocks including `vi.mock()` module mocks -- avoid it when mixing `vi.spyOn` with `vi.mock`.

### Radix UI Dropdown in Tests
When testing Radix UI DropdownMenu interactions, use `findByRole("menuitem", ...)` to locate items after opening the trigger. The menu content only renders after the trigger is clicked.

## Pre-existing Test Failures
As of 2026-02-17, there are pre-existing failures in:
- `web/src/app/(app)/create/page.test.tsx` (2 failures)
- `web/src/app/(app)/collection/[id]/page.test.tsx` (1 failure)
These are unrelated to any recently added tests.

## Project Conventions
- Test files co-located with source: `component-name.test.tsx`
- Page tests live alongside `page.tsx` files
- Mock pattern: `vi.mock()` at module level, then `import` + `vi.mocked()` for typed access
- `vi.clearAllMocks()` in `beforeEach` is the standard cleanup
- Environment: happy-dom (not jsdom) via Vitest config
