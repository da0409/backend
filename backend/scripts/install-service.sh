#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ "$(id -u)" == 0 ]] || { echo "Run with sudo" >&2; exit 1; }
task_user="${1:?Pass the non-root application user}"
[[ "$task_user" != root ]] || { echo "Do not run the API as root" >&2; exit 1; }
id "$task_user" >/dev/null
task_root="$(pwd -P)"
task_unit=/etc/systemd/system/timecapsule-java.service
if [[ -f "$task_unit" ]] && ! grep -Eq '^Description=Timecapsule Java( C\+\+)? API$' "$task_unit"; then
  echo "Refusing to overwrite an unrelated service" >&2
  exit 1
fi
cat > "$task_unit" <<UNIT
[Unit]
Description=Timecapsule Java API
After=mysql.service
Requires=mysql.service

[Service]
Type=simple
User=$task_user
WorkingDirectory=$task_root
ExecStart=/usr/bin/bash $task_root/scripts/start.sh
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now timecapsule-java
for attempt in {1..40}; do
  if curl -fsS http://127.0.0.1:8081/v1/health >/dev/null; then
    echo "Java API ready at http://localhost:8081/v1/health"
    exit 0
  fi
  sleep 0.5
done
echo "Service not ready. Inspect journalctl -u timecapsule-java" >&2
exit 1
