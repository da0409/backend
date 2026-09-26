#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/java-env.sh
set -a
source .local/dev.env
set +a
exec java -Djava.net.preferIPv4Stack=true --enable-native-access=ALL-UNNAMED -jar target/backend-0.0.1-SNAPSHOT.jar
