#!/usr/bin/env sh
# DB 호스트:포트가 연결 가능할 때까지 대기 (앱이 Postgres보다 먼저 떠서 P1000 나는 것 방지)
# 사용: ./scripts/wait-for-db.sh [호스트] [포트]
# 예: ./scripts/wait-for-db.sh latin-postgres 5432

HOST="${1:-latin-postgres}"
PORT="${2:-5432}"
MAX_ATTEMPTS=60
INTERVAL=2

# Node로 TCP 연결 시도 (Alpine에 nc가 없을 수 있어서)
try_connect() {
  node -e "
    const net = require('net');
    const c = net.createConnection($PORT, \"$HOST\");
    const t = setTimeout(() => { c.destroy(); process.exit(1); }, 5000);
    c.on('connect', () => { clearTimeout(t); c.destroy(); process.exit(0); });
    c.on('error', () => { clearTimeout(t); process.exit(1); });
  " 2>/dev/null
}

n=0
while [ $n -lt $MAX_ATTEMPTS ]; do
  if try_connect; then
    exit 0
  fi
  n=$((n + 1))
  sleep $INTERVAL
done
exit 1
