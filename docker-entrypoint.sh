#!/bin/sh
set -eu
lock_hash="$(sha256sum package-lock.json | cut -d ' ' -f 1)"
marker="node_modules/.package-lock.sha256"
if [ ! -r "$marker" ] || [ "$(cat "$marker" 2>/dev/null || true)" != "$lock_hash" ]; then
  npm ci --ignore-scripts --no-audit --loglevel=error
  printf '%s\n' "$lock_hash" > "$marker"
fi
exec "$@"
