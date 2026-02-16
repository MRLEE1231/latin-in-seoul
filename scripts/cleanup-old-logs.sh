#!/usr/bin/env bash
# logs/ 폴더에서 7일이 지난 로그 파일만 삭제 (일자별 latin-app-YYYY-MM-DD.log)
# 사용: ./scripts/cleanup-old-logs.sh [logs 디렉터리 경로]
# cron 예: 30 0 * * * /home/ubuntu/latin-in-seoul/scripts/cleanup-old-logs.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGDIR="${1:-${PROJECT_ROOT}/logs}"

if [[ ! -d "$LOGDIR" ]]; then
  exit 0
fi

# 7일(7*24시간)보다 오래된 .log 파일만 삭제 (.offset 등은 유지)
# -mtime +6 = 수정 후 6*24시간 초과 = 7일 지난 파일
find "$LOGDIR" -maxdepth 1 -type f -name "*.log" -mtime +6 -delete
