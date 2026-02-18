.PHONY: install dev build test lint clean docker-up docker-down

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