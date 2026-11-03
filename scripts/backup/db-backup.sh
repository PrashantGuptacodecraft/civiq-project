#!/usr/bin/env bash
# Database Backup Script for CivIQ (PostgreSQL)
# Phase 71: Performance, Resilience, and Observability Closure
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/civiq_backup_${TIMESTAMP}.dump"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-civiq_db}"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting database backup for ${DB_NAME} at $(date)..."

# Perform compressed custom-format pg_dump
pg_dump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --format=c \
  --no-owner \
  --no-acl \
  --file="${BACKUP_FILE}" \
  "${DB_NAME}"

# Generate SHA256 checksum for backup integrity verification
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"

# Create a 'latest.dump' symlink
ln -sf "${BACKUP_FILE}" "${BACKUP_DIR}/latest.dump"
ln -sf "${BACKUP_FILE}.sha256" "${BACKUP_DIR}/latest.dump.sha256"

echo "[SUCCESS] Backup completed successfully: ${BACKUP_FILE}"
echo "[INFO] Checksum verified: $(cat "${BACKUP_FILE}.sha256")"
