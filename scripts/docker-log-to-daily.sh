#!/usr/bin/env bash
# Docker 컨테이너의 json-file 로그를 읽어 일자별 파일로 복사합니다.
# 사용: ./scripts/docker-log-to-daily.sh [컨테이너이름]
# cron 예: */5 * * * * /home/ubuntu/latin-in-seoul/scripts/docker-log-to-daily.sh

set -e
CONTAINER="${1:-latin-app}"
# 프로젝트 루트 기준 logs (서버에서 이 스크립트는 보통 ~/latin-in-seoul 에서 실행)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGDIR="${PROJECT_ROOT}/logs"
OFFSET_FILE="${LOGDIR}/.${CONTAINER}.offset"

mkdir -p "$LOGDIR"

LOGPATH=$(sudo docker inspect "$CONTAINER" --format '{{.LogPath}}' 2>/dev/null || true)
if [[ -z "$LOGPATH" || ! -f "$LOGPATH" ]]; then
  exit 0
fi

SIZE=$(stat -c %s "$LOGPATH" 2>/dev/null || true)
[[ -z "$SIZE" ]] && exit 0

OFFSET=0
if [[ -f "$OFFSET_FILE" ]]; then
  OFFSET=$(cat "$OFFSET_FILE")
fi
# 로그 로테이션으로 파일이 새로 만들어졌으면 처음부터
if [[ -n "$OFFSET" && "$SIZE" -lt "$OFFSET" ]]; then
  OFFSET=0
fi
if [[ -z "$OFFSET" ]]; then
  OFFSET=0
fi

if [[ "$SIZE" -le "$OFFSET" ]]; then
  exit 0
fi

# jq 없으면 스킵 (설치: apt install jq)
if ! command -v jq &>/dev/null; then
  echo "$SIZE" > "$OFFSET_FILE"
  exit 0
fi

# 새로 쌓인 부분만 읽어서 한 줄씩 처리
tail -c +$((OFFSET + 1)) "$LOGPATH" 2>/dev/null | while IFS= read -r line; do
  date_part=$(echo "$line" | jq -r '.time[0:10]' 2>/dev/null)
  stream=$(echo "$line" | jq -r '.stream' 2>/dev/null)
  time_full=$(echo "$line" | jq -r '.time' 2>/dev/null)
  log_msg=$(echo "$line" | jq -r '.log | rtrimstr("\n")' 2>/dev/null)
  if [[ -n "$date_part" && "$date_part" != "null" ]]; then
    outfile="${LOGDIR}/${CONTAINER}-${date_part}.log"
    # 한 줄: [시간] [stdout|stderr] 메시지
    printf '%s [%s] %s\n' "$time_full" "$stream" "$log_msg" >> "$outfile"
  fi
done

echo "$SIZE" > "$OFFSET_FILE"
