.PHONY: dev lint format check test

dev:
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

lint:
	uv run ruff check src/

format:
	uv run ruff check --fix src/
	uv run ruff format src/

check:
	uv run ruff check src/
	uv run ruff format --check src/

test:
	uv run pytest
