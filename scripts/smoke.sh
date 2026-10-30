#!/bin/sh
set -eu
cleanup() { docker compose --profile prod down -v --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM
docker compose down -v --remove-orphans
docker compose up -d --build dev
retry() {
  i=0
  while [ "$i" -lt 30 ]; do
    curl -fsS "$1" >/dev/null 2>&1 && return 0
    i=$((i + 1)); sleep 1
  done
  return 1
}
retry http://localhost:${VITE_PORT:-5173}/
retry http://localhost:${VITE_PORT:-5173}/src/styles/main.css
if docker compose logs dev 2>&1 | grep -Eiq 'error|ENOENT|EACCES|Failed to resolve import|Pre-transform error'; then
  docker compose logs dev
  exit 1
fi
docker compose --profile prod up -d --build
retry http://localhost:${PORT:-8080}/
i=0
while [ "$i" -lt 30 ]; do
  docker compose ps --format '{{.Service}} {{.Health}}' | grep -q 'app healthy' && exit 0
  i=$((i + 1)); sleep 1
done
docker compose ps
exit 1
