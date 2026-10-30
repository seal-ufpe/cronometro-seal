.PHONY: dev test lint build verify smoke e2e ci reinstall

dev:
	docker compose up --build
test:
	docker compose --profile ci run --build --rm test npm run test:coverage
lint:
	docker compose --profile ci run --build --rm lint
build:
	docker compose --profile ci run --build --rm build
verify:
	docker compose --profile ci run --build --rm verify
smoke:
	sh scripts/smoke.sh
e2e:
	docker compose --profile prod --profile e2e up --build --abort-on-container-exit --exit-code-from e2e
reinstall:
	docker compose down -v
	docker compose build --no-cache dev
ci:
	$(MAKE) lint && $(MAKE) test && $(MAKE) verify && $(MAKE) smoke && $(MAKE) e2e
prod:
	docker compose --profile prod up --build
