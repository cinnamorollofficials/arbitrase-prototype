.PHONY: install run run-backend run-frontend run-price-worker migrate seed db-setup

install:
	cd backend && npm install
	cd frontend && powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-Command bun -ErrorAction SilentlyContinue) { bun install } else { npm install }"
	cd price-worker && go mod download

run:
	$(MAKE) -j3 run-backend run-frontend run-price-worker

run-backend:
	cd backend && npm run dev

run-frontend:
	cd frontend && powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-Command bun -ErrorAction SilentlyContinue) { bun run dev } else { npm run dev }"

run-price-worker:
	cd price-worker && go run ./cmd/price-worker

migrate:
	cd backend && npx sequelize-cli db:migrate

seed:
	cd backend && npx sequelize-cli db:seed:all

db-setup: migrate seed
