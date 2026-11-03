#!/usr/bin/env bash
# Database Restore & Disaster Recovery Drill Script for CivIQ
# Phase 71: Performance, Resilience, and Observability Closure
set -euo pipefail

BACKUP_FILE="${1:-/backups/latest.dump}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
TARGET_DB="${2:-civiq_restore_test}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Verify checksum if available
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "[INFO] Verifying backup checksum..."
  sha256sum -c "${BACKUP_FILE}.sha256"
fi

echo "[INFO] Recreating target database: ${TARGET_DB}..."
dropdb --if-exists --host="${DB_HOST}" --port="${DB_PORT}" --username="${DB_USER}" "${TARGET_DB}"
createdb --host="${DB_HOST}" --port="${DB_PORT}" --username="${DB_USER}" "${TARGET_DB}"

echo "[INFO] Restoring data from ${BACKUP_FILE} into ${TARGET_DB}..."
pg_restore \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --dbname="${TARGET_DB}" \
  --no-owner \
  --no-acl \
  --exit-on-error \
  "${BACKUP_FILE}"

echo "[INFO] Performing post-restore validation drill..."
# Query critical table counts
psql --host="${DB_HOST}" --port="${DB_PORT}" --username="${DB_USER}" --dbname="${TARGET_DB}" -c "
  SELECT 'users' as tbl, count(*) from users
  UNION ALL
  SELECT 'issues' as tbl, count(*) from issues
  UNION ALL
  SELECT 'jurisdictions' as tbl, count(*) from jurisdictions;
"

echo "[SUCCESS] Restore drill completed successfully on ${TARGET_DB}."
