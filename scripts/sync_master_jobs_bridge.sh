#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_FILE="${ROOT_DIR}/data/master_jobs.json"
DEST_DIR="${ROOT_DIR}/web/public/data"
DEST_FILE="${DEST_DIR}/master_jobs.json"

if [[ ! -f "${SOURCE_FILE}" ]]; then
  echo "Error: source file not found: ${SOURCE_FILE}" >&2
  echo "Run the pipeline first (e.g. python run_pipeline.py)." >&2
  exit 1
fi

mkdir -p "${DEST_DIR}"
cp "${SOURCE_FILE}" "${DEST_FILE}"

echo "Synced aggregated jobs:"
echo "  ${SOURCE_FILE}"
echo "  -> ${DEST_FILE}"
