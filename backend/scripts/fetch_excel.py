"""
fetch_excel.py — Download Excel files from usiu.ac.ke that the main crawler missed.

Strategy (fast, no re-crawl of all pages):
  1. Pull all page URLs from the USIU sitemap.xml
  2. Make lightweight HTTP GET requests (no JS rendering) to each page
  3. Scan the raw HTML for .xlsx / .xls href links
  4. Download every unique Excel file found that isn't already in the output dir

Usage (from tibu/backend/):
    python scripts/fetch_excel.py
    python scripts/fetch_excel.py --docs ./data/documents/
    python scripts/fetch_excel.py --workers 10   # parallel page fetches
"""

import argparse
import re
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

# ── constants ─────────────────────────────────────────────────────────────────

START_URL = "https://www.usiu.ac.ke"

SITEMAP_URLS = [
    "https://www.usiu.ac.ke/smap.xml",
    "https://www.usiu.ac.ke/sitemap.xml",
    "https://www.usiu.ac.ke/sitemap_index.xml",
]

EXCEL_EXTENSIONS = (".xlsx", ".xls")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 "
        "TIBU-Bot/1.0 (USIU Student Project)"
    ),
}

TIMEOUT = 20          # seconds per page fetch
DOWNLOAD_TIMEOUT = 60 # seconds per file download

# ── sitemap helpers ───────────────────────────────────────────────────────────

def fetch_sitemap_urls(sitemap_url: str) -> set[str]:
    urls: set[str] = set()
    try:
        resp = requests.get(sitemap_url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"  Sitemap fetch failed ({sitemap_url}): {e}")
        return urls

    try:
        root = ET.fromstring(resp.content)
    except ET.ParseError:
        return urls

    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    for entry in root.findall(f"{ns}sitemap"):
        loc = entry.find(f"{ns}loc")
        if loc is not None and loc.text:
            urls.update(fetch_sitemap_urls(loc.text.strip()))

    for entry in root.findall(f"{ns}url"):
        loc = entry.find(f"{ns}loc")
        if loc is not None and loc.text:
            urls.add(loc.text.strip())

    return urls


def get_all_page_urls() -> list[str]:
    all_urls: set[str] = set()
    for sm in SITEMAP_URLS:
        print(f"  Trying sitemap: {sm}")
        found = fetch_sitemap_urls(sm)
        if found:
            print(f"    Found {len(found)} URLs")
            all_urls.update(found)
    # Filter to only HTML pages (not documents themselves)
    pages = [
        u for u in all_urls
        if not any(u.lower().endswith(ext) for ext in (".pdf", ".docx", ".xlsx", ".xls", ".csv", ".pptx", ".ppt"))
    ]
    return sorted(pages)


# ── Excel link extraction ─────────────────────────────────────────────────────

_RE_EXCEL_HREF = re.compile(
    r'href=["\']([^"\']*\.(?:xlsx|xls))["\']',
    re.IGNORECASE,
)

def find_excel_links_in_page(page_url: str) -> set[str]:
    """Fetch a page and return any absolute Excel file URLs found in the HTML."""
    try:
        resp = requests.get(page_url, headers=HEADERS, timeout=TIMEOUT, verify=False)
        resp.raise_for_status()
    except Exception:
        return set()

    found: set[str] = set()
    for match in _RE_EXCEL_HREF.finditer(resp.text):
        href = match.group(1)
        if not href.startswith("http"):
            href = urljoin(page_url, href)
        found.add(href)
    return found


def scan_pages_for_excel(page_urls: list[str], workers: int = 8) -> set[str]:
    """Scan all pages in parallel for Excel links."""
    all_excel: set[str] = set()
    done = 0
    total = len(page_urls)

    print(f"\nScanning {total} pages for Excel links ({workers} workers)...")

    with ThreadPoolExecutor(max_workers=workers) as pool:
        future_to_url = {pool.submit(find_excel_links_in_page, url): url for url in page_urls}
        for future in as_completed(future_to_url):
            done += 1
            links = future.result()
            if links:
                page = future_to_url[future]
                print(f"  [{done}/{total}] Found {len(links)} Excel link(s) on: {page}")
                for lnk in links:
                    print(f"    -> {lnk}")
                all_excel.update(links)
            elif done % 100 == 0:
                print(f"  [{done}/{total}] ...")

    return all_excel


# ── download ──────────────────────────────────────────────────────────────────

def sanitize_filename(url: str) -> str:
    name = urlparse(url).path.split("/")[-1]
    name = re.sub(r"[^\w\-.]", "_", name)
    return name or "file.xlsx"


def download_excel(url: str, output_dir: Path) -> bool:
    filename = sanitize_filename(url)
    dest = output_dir / filename

    if dest.exists():
        print(f"  SKIP (exists): {filename}")
        return False

    print(f"  Downloading: {filename} ...", end=" ", flush=True)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=DOWNLOAD_TIMEOUT, stream=True, verify=False)
        resp.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        size_kb = dest.stat().st_size / 1024
        print(f"OK ({size_kb:.0f} KB)")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Fetch missed Excel files from usiu.ac.ke")
    parser.add_argument(
        "--docs", default="./data/documents/",
        help="Output directory for downloaded Excel files (default: ./data/documents/)"
    )
    parser.add_argument(
        "--workers", type=int, default=8,
        help="Parallel workers for page scanning (default: 8)"
    )
    args = parser.parse_args()

    output_dir = Path(args.docs)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("  TIBU -- Excel File Fetcher")
    print("=" * 60)

    # Step 1: get all page URLs from sitemap
    print("\nStep 1: Loading page URLs from sitemap...")
    page_urls = get_all_page_urls()
    print(f"  Total pages to scan: {len(page_urls)}")

    if not page_urls:
        print("No pages found in sitemap. Exiting.")
        return

    # Step 2: scan pages for Excel links
    excel_urls = scan_pages_for_excel(page_urls, workers=args.workers)

    print(f"\nStep 2 complete. Found {len(excel_urls)} unique Excel URL(s).")

    if not excel_urls:
        print("No Excel files found on any page.")
        return

    print("\nAll discovered Excel files:")
    for url in sorted(excel_urls):
        print(f"  {url}")

    # Step 3: download
    print(f"\nStep 3: Downloading to {args.docs} ...")
    downloaded = 0
    for url in sorted(excel_urls):
        if download_excel(url, output_dir):
            downloaded += 1

    print(f"\nDone. Downloaded {downloaded} new Excel file(s) to {args.docs}")
    print("Run the ingestion script to add them to the knowledge base:")
    print("  .\\scripts\\ingest.ps1 -SkipIndex")
    print("  (or: bash scripts/ingest.sh --skip-index)")
    print()


if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    main()
