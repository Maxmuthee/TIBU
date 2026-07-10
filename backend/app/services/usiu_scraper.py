"""
USIU Website Scraper — Collects university content for TIBU's knowledge base.

Scrapes key pages from usiu.ac.ke and saves them as .txt files 
ready for the document_loader pipeline.

The USIU website uses numeric-prefixed paths (e.g. /104/library-hours) for
real content pages. Flat paths like /admissions/ are navigation shells only.
Content lives in `div.main-guts` or `div.article-area`.

Usage:
    python -m app.services.usiu_scraper
    python -m app.services.usiu_scraper --output ./data/scraped/
    python -m app.services.usiu_scraper --ingest  # scrape + run document loader
"""

import argparse
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

# Key USIU content pages — verified URLs from sitemap (numeric-prefixed paths)
PAGES_TO_SCRAPE = [
    # About & Campus
    ("https://www.usiu.ac.ke/8/vision-mission-values", "vision-mission-values"),
    ("https://www.usiu.ac.ke/9/history-usiu-africa", "history-usiu-africa"),
    ("https://www.usiu.ac.ke/49/campus-map-direction", "campus-map-directions"),
    ("https://www.usiu.ac.ke/263/accreditations", "accreditations"),
    ("https://www.usiu.ac.ke/48/contact-us", "contact-us"),
    # Academics
    ("https://www.usiu.ac.ke/232/academics-transformative-teaching-learning-research", "academics-overview"),
    ("https://www.usiu.ac.ke/46/about-undergraduate-programs", "undergraduate-programs"),
    ("https://www.usiu.ac.ke/44/about-masters-programs", "masters-programs"),
    ("https://www.usiu.ac.ke/45/about-doctorate-programs", "doctorate-programs"),
    ("https://www.usiu.ac.ke/33/undergraduate-studies", "undergraduate-studies"),
    ("https://www.usiu.ac.ke/122/school-graduate-studies-research-extension", "graduate-studies"),
    ("https://www.usiu.ac.ke/academic-catalog-academic-calendar-fee-schedule/", "academic-catalog-calendar-fees"),
    # Admissions
    ("https://www.usiu.ac.ke/235/admissions-department", "admissions-department"),
    ("https://www.usiu.ac.ke/58/application-procedures-deadlines", "application-procedures"),
    ("https://www.usiu.ac.ke/59/application-checklist", "application-checklist"),
    ("https://www.usiu.ac.ke/113/undergraduate-admissions-requirements", "undergrad-admission-requirements"),
    ("https://www.usiu.ac.ke/116/masters-admissions-requirements", "masters-admission-requirements"),
    ("https://www.usiu.ac.ke/117/doctoral-admissions-requirements", "doctoral-admission-requirements"),
    ("https://www.usiu.ac.ke/290/international-applicants", "international-applicants"),
    ("https://www.usiu.ac.ke/291/transfer-admissions", "transfer-admissions"),
    ("https://www.usiu.ac.ke/286/entrance-requirements", "entrance-requirements"),
    ("https://www.usiu.ac.ke/277/get-your-questions-answered-faq", "admissions-faq"),
    # Fees & Financial Aid
    ("https://www.usiu.ac.ke/110/mode-payment", "mode-of-payment"),
    ("https://www.usiu.ac.ke/296/acceptable-modes-payment", "acceptable-payment-modes"),
    ("https://www.usiu.ac.ke/300/m-pesa-payments", "mpesa-payments"),
    ("https://www.usiu.ac.ke/303/payment-dates", "payment-dates"),
    ("https://www.usiu.ac.ke/307/tuition-refunds", "tuition-refunds"),
    ("https://www.usiu.ac.ke/294/refund-application-guidelines", "refund-guidelines"),
    ("https://www.usiu.ac.ke/85/financial-aid-office", "financial-aid-office"),
    ("https://www.usiu.ac.ke/89/government-student-aid-higher-education-loans-board-helb", "helb-loans"),
    ("https://www.usiu.ac.ke/90/institutional-scholarships", "institutional-scholarships"),
    ("https://www.usiu.ac.ke/91/institutional-grants-waivers", "grants-waivers"),
    ("https://www.usiu.ac.ke/93/work-study-programs", "work-study-programs"),
    ("https://www.usiu.ac.ke/94/externally-funded-scholarships-grants", "external-scholarships"),
    # Student Life
    ("https://www.usiu.ac.ke/231/student-life", "student-life"),
    ("https://www.usiu.ac.ke/184/student-association-cabinet", "student-government"),
    ("https://www.usiu.ac.ke/clubs-and-organizations/", "clubs-organizations"),
    # Campus Services
    ("https://www.usiu.ac.ke/104/library-hours", "library-hours"),
    ("https://www.usiu.ac.ke/101/message-from-university-librarian", "library-overview"),
    ("https://www.usiu.ac.ke/103/library-resources", "library-resources"),
    ("https://www.usiu.ac.ke/102/library-contacts-directory", "library-contacts"),
    ("https://www.usiu.ac.ke/236/counseling-department", "counseling-department"),
    ("https://www.usiu.ac.ke/64/what-counseling-", "what-is-counseling"),
    ("https://www.usiu.ac.ke/72/our-services", "counseling-services"),
    ("https://www.usiu.ac.ke/242/university-health-service", "health-services"),
    ("https://www.usiu.ac.ke/246/housing-department", "housing"),
    ("https://www.usiu.ac.ke/330/off-campus-housing", "off-campus-housing"),
    ("https://www.usiu.ac.ke/245/department-hospitality", "hospitality-dining"),
    # Career Services
    ("https://www.usiu.ac.ke/237/placement-career-services-department", "career-services"),
    ("https://www.usiu.ac.ke/96/placement-career-services-pacs-office", "career-services-office"),
    ("https://www.usiu.ac.ke/99/career-tools-listing", "career-tools"),
    ("https://www.usiu.ac.ke/100/course-advising-forms", "course-advising-forms"),
]

HEADERS = {
    "User-Agent": "TIBU-Bot/1.0 (USIU Student Project; hackathon demo)"
}

REQUEST_TIMEOUT = 15  # seconds
DELAY_BETWEEN_REQUESTS = 1  # be polite, 1 second between requests


def clean_text(raw_text: str) -> str:
    """Clean extracted text: remove excess whitespace, keep structure."""
    # Collapse multiple newlines
    text = re.sub(r"\n{3,}", "\n\n", raw_text)
    # Collapse multiple spaces
    text = re.sub(r"[ \t]{2,}", " ", text)
    # Remove lines that are just whitespace
    lines = [line.strip() for line in text.split("\n")]
    lines = [line for line in lines if line]
    return "\n".join(lines)


def scrape_page(url: str) -> str | None:
    """Fetch a page and extract main content text."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  FAILED: {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove script, style, nav, footer elements
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe"]):
        tag.decompose()

    # Check for soft 404 pages
    page_text = soup.get_text(strip=True)
    if "Page Not Found" in page_text[:200]:
        print("  SKIPPED (page not found)")
        return None

    # USIU site uses div.main-guts for main content, div.article-area as fallback
    main = (
        soup.find("div", class_="main-guts")
        or soup.find("div", class_="article-area")
        or soup.find("div", class_="panel-home-guts-wrapX")
        or soup.find("main")
        or soup.find("article")
    )

    if main:
        text = main.get_text(separator="\n", strip=True)
    else:
        # Last resort: get page_width content minus the sidebar news
        pw = soup.find("div", class_="page_width")
        if pw:
            # Remove sidebar panels
            for sidebar in pw.find_all("div", class_="panel-body"):
                sidebar.decompose()
            text = pw.get_text(separator="\n", strip=True)
        else:
            text = soup.get_text(separator="\n", strip=True)

    return clean_text(text)


def scrape_usiu(output_dir: str = "./data/scraped/") -> list[str]:
    """Scrape all USIU pages and save as text files."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    saved_files = []
    total = len(PAGES_TO_SCRAPE)

    print(f"Scraping {total} pages from usiu.ac.ke...")
    print("=" * 50)

    for i, (url, filename) in enumerate(PAGES_TO_SCRAPE, 1):
        print(f"[{i}/{total}] {filename}...", end=" ")

        text = scrape_page(url)
        if not text or len(text) < 50:
            print("SKIPPED (no content)")
            continue

        file_path = out / f"{filename}.txt"
        header = f"Source: {url}\nScraped for: TIBU Knowledge Base\n{'=' * 50}\n\n"
        file_path.write_text(header + text, encoding="utf-8")

        saved_files.append(str(file_path))
        print(f"OK ({len(text)} chars)")

        # Be polite — don't hammer the server
        if i < total:
            time.sleep(DELAY_BETWEEN_REQUESTS)

    print("=" * 50)
    print(f"Done! Saved {len(saved_files)}/{total} pages to {output_dir}")
    return saved_files


def scrape_and_ingest(output_dir: str = "./data/scraped/"):
    """Scrape USIU website, then run the document loader to ingest into Azure AI Search."""
    saved = scrape_usiu(output_dir)
    if not saved:
        print("No files scraped. Skipping ingestion.")
        return

    print("\nNow ingesting scraped content into Azure AI Search...")
    from app.services.document_loader import ingest_documents
    ingest_documents(output_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape USIU website for TIBU knowledge base")
    parser.add_argument("--output", default="./data/scraped/", help="Output directory for scraped files")
    parser.add_argument("--ingest", action="store_true", help="Also run document_loader after scraping")
    args = parser.parse_args()

    if args.ingest:
        scrape_and_ingest(args.output)
    else:
        scrape_usiu(args.output)
