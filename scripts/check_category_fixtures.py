#!/usr/bin/env python3
"""Validate extraction category rules against a small fixture set."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from extract import classify_job_category

DEFAULT_MASTER_JOBS_PATH = PROJECT_ROOT / "data" / "master_jobs.json"

FIXTURES = [
    ("Consultant (Oncologist)", "Doctor"),
    ("Consultant (Internal Medicine - Cardiology)", "Doctor"),
    ("Consultant (Haematology and Blood Transfusion)", "Doctor"),
    ("Senior Registrar Radiology", "Doctor"),
    ("Consultant (Radiophysicist)", "Doctor"),
    ("Consultant (Radio Physicist)", "Doctor"),
    ("Medical Lab Scientist", "Medical Laboratory Scientist"),
    ("Laboratory Science Intern", "Medical Laboratory Scientist"),
    ("Medical Imaging Science Intern", "Allied Health"),
    ("Sonographer", "Allied Health"),
    ("Assistant Anaesthetic Technologist / Technician", "Allied Health"),
    ("Paramedic", "Allied Health"),
    ("Clinical Psychologist", "Allied Health"),
    ("Community Health Extension Worker (CHEW)", "Public Health"),
]

AMBIGUOUS_TITLES = [
    "Clinic Officer",
    "Laboratory Technician",
    "Laboratory Analyst",
    "Renal Technologist",
]


def load_jobs(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"master_jobs file not found: {path}")

    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    jobs = payload.get("jobs", []) if isinstance(payload, dict) else payload
    if not isinstance(jobs, list):
        return []
    return [job for job in jobs if isinstance(job, dict)]


def classify_row(row: dict[str, Any]) -> str:
    return classify_job_category(
        str(row.get("job_title") or row.get("title") or ""),
        qualification=str(row.get("qualification") or ""),
        requirements=row.get("requirements") or [],
        responsibilities=row.get("responsibilities") or [],
        context_text=" ".join(
            str(row.get(key) or "")
            for key in ("description", "full_description", "raw_content", "other_info")
        ),
    )


def main() -> int:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_MASTER_JOBS_PATH
    jobs = load_jobs(path)

    print("=" * 68)
    print("  JOBBERMED CATEGORY FIXTURE CHECK")
    print("=" * 68)
    print(f"Dataset: {path}")
    print(f"Rows: {len(jobs)}")

    failures = 0

    print("\n[Expected category fixtures]")
    for title, expected in FIXTURES:
        matches = [job for job in jobs if str(job.get("job_title") or "") == title]
        if not matches:
            print(f"⚠️  Missing title in dataset: {title}")
            continue

        fixture_failed = False
        predicted_values: list[str] = []
        for row in matches:
            predicted = classify_row(row)
            predicted_values.append(predicted or "<no override>")
            if predicted != expected:
                fixture_failed = True

        if fixture_failed:
            failures += 1
            print(f"❌ {title}")
            print(f"    expected: {expected}")
            print(f"    predicted: {predicted_values}")
        else:
            print(f"✅ {title} -> {expected}")

    print("\n[Ambiguous titles for manual review]")
    for title in AMBIGUOUS_TITLES:
        matches = [job for job in jobs if str(job.get("job_title") or "") == title]
        if not matches:
            continue

        observed = sorted({str(job.get('job_category') or "") for job in matches})
        predicted = sorted({classify_row(job) or "<no override>" for job in matches})
        print(f"- {title}")
        print(f"  observed: {observed}")
        print(f"  predicted: {predicted}")

    if failures:
        print(f"\n❌ Fixture check failed: {failures} fixture(s) need attention.")
        return 1

    print("\n✅ Fixture check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
