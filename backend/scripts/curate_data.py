"""
curate_data.py — Selects academically relevant files from scraped_clean/
and copies them to data/curated/ for fast, focused ingestion.

Strategy:
  1. Exclude 4+ digit prefixed files (news/sports/media articles)
  2. From the remaining ~570 files, keep those whose filename slug
     matches any academic keyword
  3. Always include documents/, pdfs/, course_advising/ in full

Usage:
    python scripts/curate_data.py [--dry-run]
"""

import argparse
import re
import shutil
from pathlib import Path

# ---------------------------------------------------------------------------
# Keywords that indicate academic / student-service relevance
# ---------------------------------------------------------------------------
KEEP_KEYWORDS = [
    # Academics
    "course", "advising", "program", "degree", "academic", "catalog",
    "curriculum", "schedule", "timetable", "semester", "credit", "unit",
    "prerequisite", "elective", "major", "minor", "general.ed",
    "undergraduate", "graduate", "master", "doctoral", "phd",
    # Admissions
    "admission", "application", "requirement", "transfer", "checklist",
    "entrance", "enroll", "registration", "pre.registration",
    # Fees & Finance
    "fee", "tuition", "payment", "banking", "mobile.money", "mpesa",
    "financ", "refund", "deposit", "scholarship", "grant", "bursary",
    "helb", "loan", "work.study", "externally.funded",
    # Student services
    "counseling", "wellness", "health", "clinic", "mental",
    "housing", "accommodation", "hostel", "dining", "cafeteria",
    "library", "study", "research",
    "career", "internship", "placement", "job", "employ",
    "international", "visa", "immigration", "permit",
    # University info
    "about", "vision", "mission", "history", "accredit", "contact",
    "campus", "faculty", "department", "school", "college", "institute",
    "registrar", "student.affairs", "student.association", "cabinet",
    "faq", "frequently.asked", "download", "resource", "procedure",
    "sop", "guideline", "policy",
    # Specific services
    "chapel", "sport", "gym", "recreation", "alumni", "award",
    "transfer", "security", "safety",
]

# ---------------------------------------------------------------------------
# 4+ digit prefix pattern — these are almost always news/media articles
# ---------------------------------------------------------------------------
NEWS_PATTERN = re.compile(r"^\d{4,}_")


def is_relevant(filename: str) -> bool:
    """Return True if the file should be included in the curated set."""
    name = filename.lower()

    # Exclude 4+ digit news files
    if NEWS_PATTERN.match(name):
        return False

    # Keep if any keyword appears in the slug
    for kw in KEEP_KEYWORDS:
        pattern = kw.replace(".", r"[\s._-]?")
        if re.search(pattern, name):
            return True

    return False


def curate(base: Path, dry_run: bool = False):
    scraped_clean = base / "scraped_clean"
    curated = base / "curated"

    if not scraped_clean.exists():
        print(f"ERROR: {scraped_clean} not found")
        return

    # ── Collect curated scraped files ──────────────────────────────────────
    all_scraped = list(scraped_clean.glob("*.md"))
    kept = [f for f in all_scraped if is_relevant(f.name)]
    skipped = len(all_scraped) - len(kept)

    print(f"scraped_clean/  total : {len(all_scraped):>5}")
    print(f"  keeping               : {len(kept):>5}")
    print(f"  skipping (noise)      : {skipped:>5}")

    if dry_run:
        print("\n[DRY RUN] Files that would be copied:")
        for f in sorted(kept):
            print(f"  {f.name}")
        return

    # ── Copy files ─────────────────────────────────────────────────────────
    curated_scraped = curated / "scraped_clean"
    curated_scraped.mkdir(parents=True, exist_ok=True)

    for f in kept:
        shutil.copy2(f, curated_scraped / f.name)

    print(f"\nCopied {len(kept)} files to {curated_scraped}")

    # ── Report other folders (not copied — ingest directly) ────────────────
    other_folders = ["documents", "pdfs", "course_advising", "sample"]
    print("\nIngest these folders in full (unchanged):")
    for folder in other_folders:
        p = base / folder
        if p.exists():
            count = sum(1 for _ in p.rglob("*") if _.is_file())
            print(f"  {folder}/  ({count} files)")
        else:
            print(f"  {folder}/  (not found — skip)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Curate scraped data for targeted ingestion")
    parser.add_argument("--data-dir", default="./data", help="Path to data/ directory")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, don't copy files")
    args = parser.parse_args()

    curate(Path(args.data_dir), dry_run=args.dry_run)
    print("\nDone.")
