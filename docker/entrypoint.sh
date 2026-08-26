#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL 이 설정되지 않았습니다." >&2
  exit 1
fi

echo "PostgreSQL 을 기다립니다..."
for i in $(seq 1 60); do
  if pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
    echo "PostgreSQL 준비 완료."
    break
  fi
  [ "$i" = 60 ] && { echo "PostgreSQL 에 연결하지 못했습니다." >&2; exit 1; }
  sleep 1
done

echo "마이그레이션 적용..."
node scripts/migrate.mjs

# SKIP_SEED=1 이면 데모 데이터를 넣지 않는다.
if [ "$SKIP_SEED" != "1" ]; then
  echo "데모 데이터 시드..."
  node scripts/seed.mjs
  node scripts/seed-learning.mjs
fi

echo "서버 시작: http://localhost:${PORT:-3000}"
exec "$@"
