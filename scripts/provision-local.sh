#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ "$(id -u)" == 0 ]] || { echo "Run with sudo for MySQL provisioning" >&2; exit 1; }
[[ ! -e .local/dev.env && ! -e .local/test.env ]] || { echo "Local config exists; refusing to overwrite" >&2; exit 1; }
task_owner="${1:?Pass target uid:gid}"
task_user="jcap_$(openssl rand -hex 5)"
task_password="$(openssl rand -hex 24)"
install -d -m 700 .local
mysql --protocol=socket -u root <<SQL
CREATE DATABASE IF NOT EXISTS capsule_java CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS capsule_java_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '$task_user'@'127.0.0.1' IDENTIFIED BY '$task_password';
GRANT ALL PRIVILEGES ON capsule_java.* TO '$task_user'@'127.0.0.1';
GRANT ALL PRIVILEGES ON capsule_java_test.* TO '$task_user'@'127.0.0.1';
SQL
umask 077
printf 'DB_URL="jdbc:mysql://127.0.0.1:3306/capsule_java?connectionTimeZone=Asia/Shanghai"\nDB_USER=%s\nDB_PASSWORD=%s\n' "$task_user" "$task_password" > .local/dev.env
printf 'DB_URL="jdbc:mysql://127.0.0.1:3306/capsule_java_test?connectionTimeZone=Asia/Shanghai"\nDB_USER=%s\nDB_PASSWORD=%s\nMEDIA_DIR=var/test-media\n' "$task_user" "$task_password" > .local/test.env
chown -R "$task_owner" .local
echo "Local Java development and test databases configured."
