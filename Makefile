.PHONY: install dev build test lint clean docker-up docker-down setup

# 0. First-time Setup
setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env from .env.example"; \
		echo "⚠️  Edit .env and set DATABASE_URL, MONGO_URL, and NEXTAUTH_SECRET before running services."; \
	else \
		echo "ℹ️  .env already exists, skipping."; \
	fi

# 1. Installation
install:
	pnpm install

# 2. Development
dev:
	pnpm dev

# 3. Build & Quality Checks
build:
	pnpm build

lint:
	pnpm lint

test:
	pnpm test

# 4. Infrastructure (Docker)
docker-up:
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found. Run 'make setup' first."; \
		exit 1; \
	fi
	docker-compose up -d

docker-down:
	docker-compose down

# 5. Database Helpers
db-push:
	pnpm db:push

db-studio:
	pnpm --filter @logicforge/db studio

# 6. Cleaning
clean:
	pnpm clean
	docker-compose down -v
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules