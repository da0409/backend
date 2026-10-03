#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -d .git
test -f backend/pom.xml
test -f frontend/package-lock.json
test -f backend/scripts/start.sh
test -f frontend/vite.config.ts
test ! -e backend/.git
test ! -e frontend/.git
test ! -e frontend/backend
for path in backend/.local/dev.env backend/var/media/example frontend/node_modules/example frontend/dist/index.html; do
  git check-ignore -q "$path"
done
for path in frontend/.env.example frontend/.env.mock; do
  test -f "$path"
  if git check-ignore -q "$path"; then echo "Required config excluded: $path" >&2; exit 1; fi
done
echo "Repository layout and runtime exclusions verified."
