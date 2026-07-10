"""
Crawl4AI-powered USIU Website Scraper — Deep crawls usiu.ac.ke for TIBU's knowledge base.

Uses BFS deep crawling with sitemap.xml seeding to auto-discover pages,
extract clean markdown content, and find document attachments across the site.

Features:
  - Sitemap.xml parsing for comprehensive URL discovery
  - JS rendering via Playwright (handles dynamic content)
  - BFS link discovery across all *.usiu.ac.ke subdomains
  - Document detection & download (PDF, DOCX, XLSX, PPTX, etc.)
  - Clean markdown output for RAG
  - Retry logic with exponential backoff

Usage:
    python -m app.services.crawl4ai_scraper
    python -m app.services.crawl4ai_scraper --output ./data/scraped/ --docs ./data/documents/
    python -m app.services.crawl4ai_scraper --ingest  # scrape + run document loader
    python -m app.services.crawl4ai_scraper --max-pages 200 --max-depth 3
"""

import argparse
import asyncio
import re
import xml.etree.ElementTree as ET
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig
from crawl4ai.content_scraping_strategy import LXMLWebScrapingStrategy

START_URL = "https://www.usiu.ac.ke"
SITEMAP_URLS = [
    "https://www.usiu.ac.ke/smap.xml",       # actual location (from robots.txt)
    "https://www.usiu.ac.ke/sitemap.xml",     # common fallback
    "https://www.usiu.ac.ke/sitemap_index.xml",
]

# Document extensions to detect and download
DOCUMENT_EXTENSIONS = (
    ".pdf", ".docx", ".doc", ".xlsx", ".xls",
    ".pptx", ".ppt", ".csv",
)

# Non-document file extensions to skip during link discovery
MEDIA_EXTENSIONS = (
    ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico",
    ".mp4", ".mp3", ".avi", ".mov", ".wmv", ".wav",
    ".zip", ".rar", ".7z", ".tar", ".gz",
    ".exe", ".msi", ".dmg",
    ".woff", ".woff2", ".ttf", ".eot",
    ".css", ".js",
)

# URL patterns to skip (admin areas, feeds, pagination noise)
SKIP_PATTERNS = [
    r"/wp-admin",
    r"/wp-login",
    r"/wp-json",
    r"/feed(/|$)",
    r"/tag/",
    r"/author/",
    r"/page/\d+",
    r"/comment-page-",
    r"/trackback/?$",
    r"/attachment/",
    r"/xmlrpc\.php",
    r"/wp-cron\.php",
    r"\?replytocom=",
    r"\?share=",
    r"\?like_comment=",
    r"#respond$",
]

# Subdomains to exclude (require login or are non-content)
EXCLUDED_SUBDOMAINS = {
    "mail.usiu.ac.ke",
    "webmail.usiu.ac.ke",
    "sis.usiu.ac.ke",
    "portal.usiu.ac.ke",
    "cx.usiu.ac.ke",
    "transport.usiu.ac.ke",
    "moodle.usiu.ac.ke",
    "elearning.usiu.ac.ke",
    "lms.usiu.ac.ke",
}

DOWNLOAD_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 "
        "TIBU-Bot/1.0 (USIU Student Project)"
    ),
}

MAX_RETRIES = 3
RETRY_BACKOFF = 2  # seconds, multiplied by attempt number


# ---------------------------------------------------------------------------
# Sitemap parsing
# ---------------------------------------------------------------------------


def fetch_sitemap_urls(sitemap_url: str, timeout: int = 15) -> set[str]:
    """Recursively fetch and parse sitemap XML files, returning all page URLs."""
    urls: set[str] = set()
    try:
        resp = requests.get(sitemap_url, headers=DOWNLOAD_HEADERS, timeout=timeout)
        resp.raise_for_status()
    except Exception as e:
        print(f"  Sitemap fetch failed ({sitemap_url}): {e}")
        return urls

    try:
        root = ET.fromstring(resp.content)
    except ET.ParseError as e:
        print(f"  Sitemap XML parse failed ({sitemap_url}): {e}")
        return urls

    # Strip namespace for easier tag matching
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    # Check if this is a sitemap index (contains <sitemap> entries)
    for sitemap_entry in root.findall(f"{ns}sitemap"):
        loc = sitemap_entry.find(f"{ns}loc")
        if loc is not None and loc.text:
            child_urls = fetch_sitemap_urls(loc.text.strip(), timeout)
            urls.update(child_urls)

    # Collect <url><loc> entries
    for url_entry in root.findall(f"{ns}url"):
        loc = url_entry.find(f"{ns}loc")
        if loc is not None and loc.text:
            urls.add(loc.text.strip())

    return urls


def discover_sitemap_urls() -> set[str]:
    """Try multiple common sitemap locations and return all discovered URLs."""
    all_urls: set[str] = set()
    for sitemap_url in SITEMAP_URLS:
        print(f"  Trying sitemap: {sitemap_url}")
        found = fetch_sitemap_urls(sitemap_url)
        if found:
            print(f"    Found {len(found)} URLs")
            all_urls.update(found)
    return all_urls


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------


def sanitize_filename(url: str) -> str:
    """Convert a URL path into a safe filename."""
    parsed = urlparse(url)
    path = parsed.path.strip("/").replace("/", "_") or "home"
    path = re.sub(r"[^\w\-]", "_", path)
    return path[:120]


def is_usiu_domain(netloc: str) -> bool:
    """Check if a netloc belongs to usiu.ac.ke (any subdomain)."""
    netloc = netloc.lower()
    return (
        netloc == "usiu.ac.ke"
        or netloc.endswith(".usiu.ac.ke")
    ) and netloc not in EXCLUDED_SUBDOMAINS


def should_skip_url(url: str) -> bool:
    """Check if a URL matches any skip pattern."""
    return any(re.search(p, url) for p in SKIP_PATTERNS)


def is_document_url(url: str) -> bool:
    """Check if a URL points to a downloadable document."""
    path = urlparse(url).path.lower()
    return path.endswith(DOCUMENT_EXTENSIONS)


def is_media_url(url: str) -> bool:
    """Check if a URL points to a media/binary file (not a page)."""
    path = urlparse(url).path.lower()
    return path.endswith(MEDIA_EXTENSIONS)


# ---------------------------------------------------------------------------
# Content extraction
# ---------------------------------------------------------------------------


def extract_document_links(result) -> set[str]:
    """Extract document URLs (PDF, DOCX, XLSX, PPTX, etc.) from a crawl result."""
    doc_urls: set[str] = set()

    # From structured links dict
    links = getattr(result, "links", {})
    if isinstance(links, dict):
        for link_type in ("internal", "external"):
            for link in links.get(link_type, []):
                href = link.get("href", "") if isinstance(link, dict) else str(link)
                if href and is_document_url(href):
                    if not href.startswith("http"):
                        href = urljoin(START_URL, href)
                    doc_urls.add(href)

    # Fallback: regex scan the raw HTML for document links
    html = getattr(result, "html", "") or ""
    ext_pattern = "|".join(re.escape(ext) for ext in DOCUMENT_EXTENSIONS)
    for match in re.finditer(
        rf'href=["\']([^"\']*(?:{ext_pattern}))["\']', html, re.IGNORECASE
    ):
        url = match.group(1)
        if not url.startswith("http"):
            url = urljoin(START_URL, url)
        doc_urls.add(url)

    return doc_urls


def get_markdown_content(result) -> str:
    """Extract markdown text from a CrawlResult (handles v0.7 str and v0.8 object)."""
    md = result.markdown
    if md is None:
        return ""
    # v0.8: MarkdownResult object
    if hasattr(md, "raw_markdown"):
        return md.fit_markdown or md.raw_markdown or ""
    if isinstance(md, str):
        return md
    return str(md)


def clean_markdown(text: str) -> str:
    """Strip repeated nav menus, footers, and boilerplate from USIU page markdown.

    USIU pages render as:
        [top nav menu]  ~200 lines of bullet-list links
        [breadcrumb]    e.g.  [Home](/home/) / About / Page Title
        [page content]  the actual useful text
        [footer]        © 20XX. USIU-Africa ...
        [bottom nav]    duplicate of top nav
        [google widget] Google Translate snippet

    This function locates the breadcrumb line to find where content starts,
    and the copyright line to find where it ends, keeping only the meat.
    """
    lines = text.split("\n")

    # --- Find content start: breadcrumb line or #offcanvas anchor ---
    content_start = 0
    for i, line in enumerate(lines):
        # The offcanvas anchor is an empty link just before actual content — skip it
        if re.search(r"#offcanvas\)", line):
            content_start = i + 1
            break
    # If no offcanvas found, look for the breadcrumb pattern
    if content_start == 0:
        for i, line in enumerate(lines):
            if re.match(r"\[Home\]\(https?://.*usiu.*\) / ", line):
                content_start = i
                break

    # --- Find content end: copyright line ---
    content_end = len(lines)
    for i, line in enumerate(lines):
        if re.search(r"©\s*20\d{2}.*USIU", line):
            content_end = i
            break

    # Extract the content slice
    body = lines[content_start:content_end]

    # Remove residual widget/social noise at the end
    while body and re.match(
        r"^(\s*$|#{1,4}\s*Social Media|.*Twitter.*|.*Facebook.*|"
        r"!\[loading.*\]|.*\(https?://(www\.)?(facebook|twitter|youtube|"
        r"instagram|linkedin)\.com.*|####\s*Featured Documents.*)", body[-1]
    ):
        body.pop()

    # Remove leading blank / link-only lines that are nav remnants
    while body and re.match(r"^(\s*$|\[?\s*$|\s*\*\s*\[)", body[0]):
        # But stop if the line looks like actual list content (has real text)
        if re.match(r"\s*\*\s*\[.*\]\(.*\)\s*$", body[0]):
            body.pop(0)
        else:
            break

    cleaned = "\n".join(body).strip()
    return cleaned


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------


def download_document(url: str, output_dir: Path) -> str | None:
    """Download a single document file (PDF, DOCX, XLSX, etc.)."""
    try:
        filename = urlparse(url).path.split("/")[-1]
        # Ensure filename has an extension
        if not any(filename.lower().endswith(ext) for ext in DOCUMENT_EXTENSIONS):
            # Try to infer from URL
            for ext in DOCUMENT_EXTENSIONS:
                if ext in url.lower():
                    filename += ext
                    break
        filename = re.sub(r"[^\w\-.]", "_", filename)

        dest = output_dir / filename
        if dest.exists():
            print(f"  SKIP (exists): {filename}")
            return str(dest)

        print(f"  Downloading: {filename}...", end=" ")

        # Try with SSL verification first, fall back to unverified if it fails
        try:
            resp = requests.get(url, headers=DOWNLOAD_HEADERS, timeout=30, stream=True, verify=True)
            resp.raise_for_status()
        except requests.exceptions.SSLError:
            # Retry without SSL verification for sites with certificate issues
            resp = requests.get(url, headers=DOWNLOAD_HEADERS, timeout=30, stream=True, verify=False)
            resp.raise_for_status()

        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        size_kb = dest.stat().st_size / 1024
        print(f"OK ({size_kb:.0f} KB)")
        return str(dest)
    except Exception as e:
        print(f"FAILED: {e}")
        return None


# ---------------------------------------------------------------------------
# Link discovery
# ---------------------------------------------------------------------------


def extract_internal_links(result) -> set[str]:
    """Extract internal usiu.ac.ke links from a crawl result for BFS discovery."""
    found: set[str] = set()
    links = getattr(result, "links", {})
    if isinstance(links, dict):
        for link in links.get("internal", []):
            href = link.get("href", "") if isinstance(link, dict) else str(link)
            if not href:
                continue
            # Normalize: strip fragment, ensure absolute
            if not href.startswith("http"):
                href = urljoin(result.url, href)
            href = href.split("#")[0].rstrip("/")
            parsed = urlparse(href)
            # Accept any *.usiu.ac.ke subdomain (except excluded ones)
            if is_usiu_domain(parsed.netloc) and not is_document_url(href) and not is_media_url(href):
                found.add(href)

    # Also extract from external links that are actually usiu.ac.ke subdomains
    if isinstance(links, dict):
        for link in links.get("external", []):
            href = link.get("href", "") if isinstance(link, dict) else str(link)
            if not href:
                continue
            if not href.startswith("http"):
                href = urljoin(result.url, href)
            href = href.split("#")[0].rstrip("/")
            parsed = urlparse(href)
            if is_usiu_domain(parsed.netloc) and not is_document_url(href) and not is_media_url(href):
                found.add(href)

    return found


# ---------------------------------------------------------------------------
# Main crawl
# ---------------------------------------------------------------------------


async def crawl_usiu(
    output_dir: str = "./data/scraped/",
    doc_dir: str = "./data/documents/",
    max_depth: int = 3,
    max_pages: int = 200,
) -> tuple[list[str], list[str]]:
    """Manual BFS crawl of usiu.ac.ke → save pages as markdown + download documents.

    Uses sitemap.xml for initial URL seeding, then BFS link discovery.
    Each page is crawled individually with retry logic; links discovered
    on each page are added to the queue up to ``max_depth`` levels.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    doc_out = Path(doc_dir)
    doc_out.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Phase 1: Discover URLs from sitemap.xml
    # ------------------------------------------------------------------
    print("Phase 1: Discovering URLs from sitemap.xml...")
    sitemap_urls = discover_sitemap_urls()

    # BFS state: queue holds (url, depth), visited tracks normalized URLs
    queue: deque[tuple[str, int]] = deque()
    visited: set[str] = set()

    # Seed with start URL at depth 0
    queue.append((START_URL, 0))

    # Seed with sitemap URLs at depth 1 (they are known to exist)
    for surl in sitemap_urls:
        parsed = urlparse(surl)
        if is_usiu_domain(parsed.netloc) and not is_document_url(surl) and not is_media_url(surl):
            norm = surl.split("#")[0].rstrip("/")
            if norm not in visited:
                queue.append((surl, 1))

    print(f"  Seeded BFS queue with {len(queue)} URLs (1 start + {len(queue) - 1} from sitemap)")
    print()

    # ------------------------------------------------------------------
    # Phase 2: BFS crawl
    # ------------------------------------------------------------------
    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        headers=DOWNLOAD_HEADERS,
    )
    run_config = CrawlerRunConfig(
        scraping_strategy=LXMLWebScrapingStrategy(),
        verbose=False,
    )

    saved_pages: list[str] = []
    all_doc_urls: set[str] = set()
    page_count = 0

    # Also collect document URLs found in the sitemap directly
    for surl in sitemap_urls:
        if is_document_url(surl):
            all_doc_urls.add(surl)

    print(f"Phase 2: Crawling {START_URL} (max_depth={max_depth}, max_pages={max_pages})...")
    print("=" * 60)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        while queue and page_count < max_pages:
            url, depth = queue.popleft()

            # Normalize for dedup
            norm = url.split("#")[0].rstrip("/")
            if norm in visited:
                continue
            visited.add(norm)

            if should_skip_url(url):
                continue

            # Crawl this single page with retry logic
            result = None
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    result = await crawler.arun(url, config=run_config)
                    if result.success:
                        break
                    # Non-success but no exception — retry
                    if attempt < MAX_RETRIES:
                        wait = RETRY_BACKOFF * attempt
                        print(f"  Retry {attempt}/{MAX_RETRIES} for {url} (waiting {wait}s)...")
                        await asyncio.sleep(wait)
                except Exception as e:
                    if attempt < MAX_RETRIES:
                        wait = RETRY_BACKOFF * attempt
                        print(f"  Retry {attempt}/{MAX_RETRIES} for {url} after error: {e} (waiting {wait}s)...")
                        await asyncio.sleep(wait)
                    else:
                        print(f"  ERROR crawling {url} after {MAX_RETRIES} attempts: {e}")

            if result is None or not result.success:
                page_count += 1
                print(f"[{page_count}] FAIL d={depth}: {url}")
                continue

            page_count += 1

            # Collect document links from every page
            doc_links = extract_document_links(result)
            all_doc_urls.update(doc_links)

            # Discover new links for BFS (if within depth budget)
            if depth < max_depth:
                new_links = extract_internal_links(result)
                for link in new_links:
                    link_norm = link.split("#")[0].rstrip("/")
                    if link_norm not in visited:
                        queue.append((link, depth + 1))

            # Extract markdown content and strip nav/footer boilerplate
            content = get_markdown_content(result)
            content = clean_markdown(content)
            if not content or len(content.strip()) < 50:
                print(f"[{page_count}] SKIP (thin) d={depth}: {url}")
                continue

            # Save page as markdown
            filename = sanitize_filename(url)
            file_path = out / f"{filename}.md"
            header = (
                f"Source: {url}\n"
                f"Depth: {depth}\n"
                f"Scraped for: TIBU Knowledge Base\n"
                f"{'=' * 50}\n\n"
            )
            file_path.write_text(header + content, encoding="utf-8")
            saved_pages.append(str(file_path))

            print(f"[{page_count}] d={depth} OK ({len(content):,} chars): {url}")

    print("=" * 60)
    print(f"Crawled & saved {len(saved_pages)} pages to {output_dir}")

    # ------------------------------------------------------------------
    # Phase 3: Download discovered documents
    # ------------------------------------------------------------------
    downloaded_docs: list[str] = []
    if all_doc_urls:
        print(f"\nPhase 3: Found {len(all_doc_urls)} document link(s). Downloading...")
        # Group by type for reporting
        by_ext: dict[str, list[str]] = {}
        for doc_url in sorted(all_doc_urls):
            ext = Path(urlparse(doc_url).path).suffix.lower() or ".unknown"
            by_ext.setdefault(ext, []).append(doc_url)

        for ext, urls in sorted(by_ext.items()):
            print(f"  {ext}: {len(urls)} file(s)")

        for doc_url in sorted(all_doc_urls):
            path = download_document(doc_url, doc_out)
            if path:
                downloaded_docs.append(path)
        print(f"Downloaded {len(downloaded_docs)}/{len(all_doc_urls)} documents to {doc_dir}")
    else:
        print("No document links discovered on crawled pages.")

    print(f"\nTOTAL: {len(saved_pages)} pages, {len(downloaded_docs)} documents")
    return saved_pages, downloaded_docs


def scrape_and_ingest(
    output_dir: str = "./data/scraped/",
    doc_dir: str = "./data/documents/",
    max_depth: int = 3,
    max_pages: int = 200,
):
    """Crawl USIU website then ingest everything into Azure AI Search."""
    pages, docs = asyncio.run(
        crawl_usiu(output_dir, doc_dir, max_depth, max_pages)
    )

    if not pages and not docs:
        print("Nothing scraped. Skipping ingestion.")
        return

    print("\nIngesting content into Azure AI Search...")
    from app.services.document_loader import ingest_documents

    if pages:
        print(f"  Ingesting {len(pages)} scraped pages from {output_dir}...")
        ingest_documents(output_dir)
    if docs:
        print(f"  Ingesting {len(docs)} documents from {doc_dir}...")
        ingest_documents(doc_dir)
    print("All done!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Crawl4AI deep-scraper for USIU website (TIBU project)"
    )
    parser.add_argument(
        "--output", default="./data/scraped/",
        help="Output directory for scraped pages (default: ./data/scraped/)"
    )
    parser.add_argument(
        "--docs", default="./data/documents/",
        help="Output directory for downloaded documents (default: ./data/documents/)"
    )
    parser.add_argument(
        "--max-depth", type=int, default=3,
        help="Maximum crawl depth (default: 3)"
    )
    parser.add_argument(
        "--max-pages", type=int, default=200,
        help="Maximum pages to crawl (default: 200)"
    )
    parser.add_argument(
        "--ingest", action="store_true",
        help="Also run document_loader after scraping"
    )
    parser.add_argument(
        "--clean-only", action="store_true",
        help="Only clean existing scraped files (strip nav/footer boilerplate)"
    )
    args = parser.parse_args()

    if args.clean_only:
        # Re-clean all existing .md files in the output directory
        out = Path(args.output)
        files = sorted(out.glob("*.md"))
        print(f"Cleaning {len(files)} files in {args.output}...")
        for fp in files:
            raw = fp.read_text(encoding="utf-8")
            # Preserve our metadata header (first 4 lines: Source, Depth, Scraped, ===)
            parts = raw.split("\n", 4)
            if len(parts) >= 5 and parts[0].startswith("Source:"):
                header = "\n".join(parts[:4]) + "\n\n"
                body = parts[4]
            else:
                header = ""
                body = raw
            cleaned = clean_markdown(body)
            if cleaned and len(cleaned.strip()) >= 50:
                fp.write_text(header + cleaned, encoding="utf-8")
                print(f"  OK ({len(body):,} → {len(cleaned):,} chars): {fp.name}")
            else:
                fp.unlink()
                print(f"  REMOVED (thin after cleaning): {fp.name}")
        print("Done.")
    elif args.ingest:
        scrape_and_ingest(args.output, args.docs, args.max_depth, args.max_pages)
    else:
        asyncio.run(
            crawl_usiu(args.output, args.docs, args.max_depth, args.max_pages)
        )
