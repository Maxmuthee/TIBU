"""
Preprocess scraped USIU markdown files before ingestion.

Removes:
  - Scraper header block (Source / Depth / Scraped for / ====)
  - Breadcrumb navigation lines
  - "Featured Documents" footer section (and everything after)
  - "Latest News" footer section (and everything after)
  - Markdown image tags  ![alt](url)
  - JavaScript UI accordion links  [ Title ](javascript:)
  - "Expand All | Collapse All" UI text
  - Residual bare URLs (http/https lines)
  - Converts  [text](url)  →  text  (keeps label, drops URL noise)
  - Collapses 3+ blank lines into 2

Skips output files with fewer than MIN_CONTENT_CHARS of meaningful content.

Usage:
    python -m app.services.preprocess_scraped \
        --input  ./data/scraped \
        --output ./data/scraped_clean

Run from the backend/ directory.
"""

import re
import argparse
from pathlib import Path

# ── tuneable constants ────────────────────────────────────────────────────────
MIN_CONTENT_CHARS = 150   # discard files shorter than this after cleaning

# ── regex patterns (compiled once) ───────────────────────────────────────────

# Scraper metadata header line
_RE_HEADER_SOURCE   = re.compile(r'^Source:\s*https?://\S+', re.IGNORECASE)
_RE_HEADER_DEPTH    = re.compile(r'^Depth:\s*\d+', re.IGNORECASE)
_RE_HEADER_SCRAPED  = re.compile(r'^Scraped for:\s*.+', re.IGNORECASE)
_RE_HEADER_DIVIDER  = re.compile(r'^={10,}')

# Breadcrumb: line that starts with [Home]( or contains " / " navigation chain
_RE_BREADCRUMB = re.compile(
    r'^\[Home\]\(https?://[^)]+\)\s*/', re.IGNORECASE
)

# Footer section anchors — everything from these headings onward is boilerplate
_FOOTER_ANCHORS = [
    re.compile(r'^#{1,6}\s*Featured Documents', re.IGNORECASE),
    re.compile(r'^#{1,6}\s*Latest News', re.IGNORECASE),
    re.compile(r'^#{1,6}\s*Related Downloads', re.IGNORECASE),
]

# Image tags  ![alt text](url)
_RE_IMAGE = re.compile(r'!\[[^\]]*\]\([^)]*\)')

# JavaScript accordion links  [ Title ](javascript:)
_RE_JS_LINK = re.compile(r'\[[^\]]+\]\(javascript:[^)]*\)')

# "Expand All | Collapse All" UI text
_RE_EXPAND_COLLAPSE = re.compile(r'Expand All\s*\|\s*Collapse All', re.IGNORECASE)

# Bare standalone URLs — plain or angle-bracket wrapped
_RE_BARE_URL = re.compile(r'^\s*<?https?://\S+>?\s*$')

# Markdown links [label](url) → label  (preserves the anchor text)
_RE_MD_LINK = re.compile(r'\[([^\]]+)\]\(https?://[^)]+\)')

# Inline link-only lines that become empty after stripping links (e.g. category links)
# Category lines: "_English_" or "Category: [...]" — keep the label
_RE_CATEGORY_LABEL = re.compile(r'^Category:\s*', re.IGNORECASE)

# Collapse 3+ consecutive blank lines → 2 blank lines
_RE_MULTI_BLANK = re.compile(r'\n{3,}')


def _is_footer_anchor(line: str) -> bool:
    return any(p.match(line) for p in _FOOTER_ANCHORS)


def _is_scraper_header(line: str) -> bool:
    return bool(
        _RE_HEADER_SOURCE.match(line)
        or _RE_HEADER_DEPTH.match(line)
        or _RE_HEADER_SCRAPED.match(line)
        or _RE_HEADER_DIVIDER.match(line)
    )


def clean_markdown(raw: str) -> str:
    """
    Clean a single scraped markdown document.
    Returns the cleaned text, or an empty string if the page has no real content.
    """
    lines = raw.splitlines()
    cleaned_lines = []
    in_footer = False

    for line in lines:
        # Once we hit a footer anchor, discard the rest of the file
        if _is_footer_anchor(line):
            in_footer = True
        if in_footer:
            continue

        # Drop scraper metadata header lines
        if _is_scraper_header(line):
            continue

        # Drop breadcrumb navigation
        if _RE_BREADCRUMB.match(line.strip()):
            continue

        # Drop bare standalone URLs
        if _RE_BARE_URL.match(line):
            continue

        # Drop image markdown
        line = _RE_IMAGE.sub('', line)

        # Drop JavaScript accordion links entirely
        line = _RE_JS_LINK.sub('', line)

        # Remove "Expand All | Collapse All"
        line = _RE_EXPAND_COLLAPSE.sub('', line)

        # Convert markdown links to plain anchor text
        line = _RE_MD_LINK.sub(r'\1', line)

        # Drop "Category: ..." lines that are now just noise
        if _RE_CATEGORY_LABEL.match(line.strip()) and len(line.strip()) < 12:
            continue

        cleaned_lines.append(line)

    text = '\n'.join(cleaned_lines)

    # Collapse 3+ blank lines → 2
    text = _RE_MULTI_BLANK.sub('\n\n', text)

    return text.strip()


def preprocess_directory(input_dir: str, output_dir: str) -> None:
    input_path  = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    md_files = sorted(input_path.glob('*.md'))
    total        = len(md_files)
    kept         = 0
    skipped_empty = 0
    chars_before = 0
    chars_after  = 0

    print(f"Processing {total} markdown files from '{input_dir}'")
    print(f"Output directory: '{output_dir}'")
    print(f"Minimum content threshold: {MIN_CONTENT_CHARS} chars\n")

    for i, md_file in enumerate(md_files, 1):
        try:
            raw = md_file.read_text(encoding='utf-8', errors='replace')
        except Exception as e:
            print(f"  [SKIP] {md_file.name}: read error — {e}")
            skipped_empty += 1
            continue

        chars_before += len(raw)
        cleaned = clean_markdown(raw)

        if len(cleaned) < MIN_CONTENT_CHARS:
            skipped_empty += 1
            continue

        chars_after += len(cleaned)
        out_file = output_path / md_file.name
        out_file.write_text(cleaned, encoding='utf-8')
        kept += 1

        if i % 500 == 0:
            print(f"  {i}/{total} processed — kept {kept} so far …")

    reduction_pct = 100 * (1 - chars_after / chars_before) if chars_before else 0

    print(f"\n--- Summary ---")
    print(f"  Total files scanned : {total:,}")
    print(f"  Files kept          : {kept:,}")
    print(f"  Files skipped       : {skipped_empty:,}  (below {MIN_CONTENT_CHARS}-char threshold)")
    print(f"  Chars before        : {chars_before:,}")
    print(f"  Chars after         : {chars_after:,}")
    print(f"  Size reduction      : {reduction_pct:.1f}%")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Preprocess scraped USIU markdown files before ingestion.'
    )
    parser.add_argument(
        '--input',  default='./data/scraped',
        help='Directory containing raw .md files (default: ./data/scraped)'
    )
    parser.add_argument(
        '--output', default='./data/scraped_clean',
        help='Output directory for cleaned files (default: ./data/scraped_clean)'
    )
    args = parser.parse_args()
    preprocess_directory(args.input, args.output)
