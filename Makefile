.PHONY: install run run-backend run-frontend run-price-worker migrate seed db-setup

install:
	npm --prefix backend install
	cd frontend && bun install
	cd price-worker && go mod download

run:
	$(MAKE) -j3 run-backend run-frontend run-price-worker

run-backend:
	npm --prefix backend run dev

run-frontend:
	cd frontend && bun run dev

run-price-worker:
	cd price-worker && go run ./cmd/price-worker

migrate:
	cd backend && npx sequelize-cli db:migrate

seed:
	cd backend && npx sequelize-cli db:seed:all

db-setup: migrate seed
