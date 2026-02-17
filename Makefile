# === Port Configuration ===
# Override at invocation:  make dev CORE_PORT=8001 WEB_PORT=3001
# Or persist in .ports.mk: echo "CORE_PORT = 8001" >> .ports.mk
-include .ports.mk

CORE_PORT         ?= 8000
WEB_PORT          ?= 3000
SB_API_PORT       ?= 54321
SB_DB_PORT        ?= 54322
SB_STUDIO_PORT    ?= 54323
SB_INBUCKET_PORT  ?= 54324
SB_ANALYTICS_PORT ?= 54327

.PHONY: dev dev-db dev-stop build lint format check install test test-watch test-coverage release release-first config-ports ports

dev:
	@echo "Starting db, core (:$(CORE_PORT)), and web (:$(WEB_PORT))..."
	@$(MAKE) dev-db
	@trap 'echo "\nStopping all services..."; kill $$pid1 $$pid2 2>/dev/null; wait $$pid1 $$pid2 2>/dev/null; cd db && supabase stop; echo "All services stopped."; exit 0' INT TERM; \
	$(MAKE) dev-core & pid1=$$!; \
	$(MAKE) dev-web & pid2=$$!; \
	wait

dev-db:
	cd db && supabase start

dev-stop:
	cd db && supabase stop

dev-core:
	$(MAKE) -C core dev PORT=$(CORE_PORT)

dev-web:
	PORT=$(WEB_PORT) pnpm --filter web dev

build:
	pnpm turbo build

lint:
	$(MAKE) -C core lint
	pnpm turbo lint

format:
	$(MAKE) -C core format
	pnpm turbo format

check:
	$(MAKE) -C core check
	pnpm turbo format:check

install:
	pnpm install
	cd core && uv sync

test:
	$(MAKE) -C core test
	pnpm turbo test

test-watch:
	pnpm --filter web test:watch

test-coverage:
	$(MAKE) -C core test-coverage
	pnpm turbo test:coverage

release:
	pnpm release

release-first:
	pnpm release:first

# --- Port helpers -----------------------------------------------------------

config-ports: ## Update Supabase ports in db/supabase/config.toml
	@echo "Updating Supabase ports in db/supabase/config.toml..."
	@sed -i '' '/^\[api\]$$/,/^\[/s/^port = .*/port = $(SB_API_PORT)/' db/supabase/config.toml
	@sed -i '' '/^\[db\]$$/,/^\[/s/^port = .*/port = $(SB_DB_PORT)/' db/supabase/config.toml
	@sed -i '' '/^\[studio\]$$/,/^\[/s/^port = .*/port = $(SB_STUDIO_PORT)/' db/supabase/config.toml
	@sed -i '' '/^\[inbucket\]$$/,/^\[/s/^port = .*/port = $(SB_INBUCKET_PORT)/' db/supabase/config.toml
	@sed -i '' '/^\[analytics\]$$/,/^\[/s/^port = .*/port = $(SB_ANALYTICS_PORT)/' db/supabase/config.toml
	@sed -i '' 's|site_url = "http://127.0.0.1:[0-9]*"|site_url = "http://127.0.0.1:$(WEB_PORT)"|' db/supabase/config.toml
	@sed -i '' 's|"https://127.0.0.1:[0-9]*"|"https://127.0.0.1:$(WEB_PORT)"|' db/supabase/config.toml
	@echo "Done. Update your .env files to match:"
	@echo "  core/.env       → SUPABASE_URL=http://127.0.0.1:$(SB_API_PORT)"
	@echo "  web/.env.local  → NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:$(SB_API_PORT)"
	@echo "  web/.env.local  → NEXT_PUBLIC_CORE_API_URL=http://localhost:$(CORE_PORT)"

ports: ## Show current port configuration
	@echo "=== Port Configuration ==="
	@echo "Core API:           http://localhost:$(CORE_PORT)"
	@echo "Web frontend:       http://localhost:$(WEB_PORT)"
	@echo "Supabase API:       http://localhost:$(SB_API_PORT)"
	@echo "Supabase DB:        postgresql://localhost:$(SB_DB_PORT)"
	@echo "Supabase Studio:    http://localhost:$(SB_STUDIO_PORT)"
	@echo "Supabase Inbucket:  http://localhost:$(SB_INBUCKET_PORT)"
	@echo "Supabase Analytics: http://localhost:$(SB_ANALYTICS_PORT)"
