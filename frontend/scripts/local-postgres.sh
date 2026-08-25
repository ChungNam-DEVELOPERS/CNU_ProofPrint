#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="${PROOFPRINT_PGDATA:-$PROJECT_DIR/.data/postgres}"
PORT="${PROOFPRINT_PGPORT:-55432}"
DATABASE="${PROOFPRINT_PGDATABASE:-cnu_proofprint}"
LOG_FILE="$DATA_DIR/server.log"

postgres_ready() {
  pg_isready -h 127.0.0.1 -p "$PORT" -d postgres >/dev/null 2>&1
}

initialize_cluster() {
  if [[ -f "$DATA_DIR/PG_VERSION" ]]; then
    return
  fi

  mkdir -p "$DATA_DIR"
  initdb \
    --pgdata="$DATA_DIR" \
    --username=postgres \
    --auth=trust \
    --encoding=UTF8 \
    --locale=C >/dev/null
}

start_database() {
  initialize_cluster

  if ! postgres_ready; then
    pg_ctl \
      --pgdata="$DATA_DIR" \
      --log="$LOG_FILE" \
      --options="-p $PORT -h 127.0.0.1" \
      start >/dev/null
  fi

  for _ in {1..30}; do
    if postgres_ready; then
      break
    fi
    sleep 0.2
  done

  if ! postgres_ready; then
    echo "PostgreSQL did not become ready. See $LOG_FILE" >&2
    exit 1
  fi

  if ! psql -h 127.0.0.1 -p "$PORT" -U postgres -d postgres -Atqc \
    "select 1 from pg_database where datname = '$DATABASE'" | grep -q 1; then
    createdb -h 127.0.0.1 -p "$PORT" -U postgres "$DATABASE"
  fi

  echo "PostgreSQL ready at postgres://postgres@127.0.0.1:$PORT/$DATABASE"
}

stop_database() {
  if [[ ! -f "$DATA_DIR/PG_VERSION" ]]; then
    echo "Local PostgreSQL has not been initialized."
    return
  fi

  if pg_ctl --pgdata="$DATA_DIR" status >/dev/null 2>&1; then
    pg_ctl --pgdata="$DATA_DIR" stop --mode=fast >/dev/null
    echo "Local PostgreSQL stopped."
  else
    echo "Local PostgreSQL is already stopped."
  fi
}

status_database() {
  if postgres_ready; then
    echo "Local PostgreSQL is ready on port $PORT."
    return
  fi

  echo "Local PostgreSQL is not running."
  exit 1
}

case "${1:-}" in
  start)
    start_database
    ;;
  stop)
    stop_database
    ;;
  status)
    status_database
    ;;
  *)
    echo "Usage: $0 {start|stop|status}" >&2
    exit 2
    ;;
esac
