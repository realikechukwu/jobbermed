#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_FILE="${ROOT_DIR}/data/master_jobs.json"
DEST_FILE="${ROOT_DIR}/web/public/data/master_jobs.json"

if [[ ! -f "${SOURCE_FILE}" ]]; then
  echo "Bridge check failed: missing source file: ${SOURCE_FILE}" >&2
  exit 1
fi

if [[ ! -f "${DEST_FILE}" ]]; then
  echo "Bridge check failed: missing destination file: ${DEST_FILE}" >&2
  exit 1
fi

if cmp -s "${SOURCE_FILE}" "${DEST_FILE}"; then
  echo "Bridge check passed: source and destination master_jobs.json are in sync."
  exit 0
fi

echo "Bridge check failed: ${SOURCE_FILE} and ${DEST_FILE} differ." >&2
echo "Run ./scripts/sync_master_jobs_bridge.sh to resync." >&2
exit 1
