.PHONY: dev lint format check test test-coverage

PORT ?= 8000

dev:
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port $(PORT)

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

test-coverage:
	uv run pytest --cov=src/app --cov-report=term-missing --cov-report=html
