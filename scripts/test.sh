#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/java-env.sh
set -a
source .local/test.env
set +a
[[ "$DB_URL" == *"/capsule_java_test?"* ]] || { echo "Refusing non-test database" >&2; exit 1; }
exec bash mvnw verify "$@"
