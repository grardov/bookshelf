.PHONY: dev dev-db dev-stop build lint format check install test release release-first

dev:
	@echo "Starting db, core, and web..."
	$(MAKE) dev-db
	$(MAKE) -j2 dev-core dev-web

dev-db:
	cd db && supabase start

dev-stop:
	cd db && supabase stop

dev-core:
	$(MAKE) -C core dev

dev-web:
	pnpm turbo dev

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

release:
	pnpm release

release-first:
	pnpm release:first
