#!/usr/bin/env bash
# =============================================================================
# TIBU Knowledge Base — Full Ingestion Pipeline
# =============================================================================
# Ingests all USIU data sources into Azure AI Search.
#
# Usage (from tibu/backend/):
#   bash scripts/ingest.sh               # full run (all sources)
#   bash scripts/ingest.sh --skip-index  # skip index creation (re-ingest only)
#
# Make sure your .env file at tibu/.env is populated with Azure credentials
# before running.
# =============================================================================

set -e  # exit immediately on any error

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RED="\033[0;31m"
BOLD="\033[1m"
NC="\033[0m"

# ── Resolve backend directory ─────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

# ── Parse flags ──────────────────────────────────────────────────────────────
SKIP_INDEX=false
for arg in "$@"; do
  case "$arg" in
    --skip-index) SKIP_INDEX=true ;;
  esac
done

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo -e "${CYAN}${BOLD}   TIBU — Azure AI Search Ingestion Pipeline                ${NC}"
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo ""

# ── Pre-flight checks ─────────────────────────────────────────────────────────
ENV_FILE="$BACKEND_DIR/../.env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}ERROR: .env file not found at $ENV_FILE${NC}"
  echo "Copy tibu/.env.example to tibu/.env and fill in your Azure credentials."
  exit 1
fi

# ── Virtual environment ───────────────────────────────────────────────────────
VENV_PYTHON=""
for venv in ".venv/Scripts/python" ".venv/bin/python" "venv/Scripts/python" "venv/bin/python"; do
  if [ -f "$BACKEND_DIR/$venv" ]; then
    VENV_PYTHON="$BACKEND_DIR/$venv"
    break
  fi
done

if [ -n "$VENV_PYTHON" ]; then
  PYTHON="$VENV_PYTHON"
  echo -e "${GREEN}Using venv: $PYTHON${NC}"
else
  PYTHON="python"
  echo -e "${YELLOW}No venv found — using system python${NC}"
fi

echo ""

# ── Helper ────────────────────────────────────────────────────────────────────
run_step() {
  local step="$1"
  local label="$2"
  local path="$3"
  local extra_flags="${4:-}"

  if [ ! -d "$BACKEND_DIR/$path" ]; then
    echo -e "${YELLOW}[Step $step] SKIP — directory not found: $path${NC}"
    return
  fi

  local count
  count=$(find "$BACKEND_DIR/$path" -type f | wc -l)

  echo -e "${CYAN}[Step $step/5] ${BOLD}$label${NC}"
  echo -e "  Path   : $path"
  echo -e "  Files  : $count"
  echo ""

  # shellcheck disable=SC2086
  "$PYTHON" -m app.services.document_loader --path "./$path" $extra_flags

  echo ""
  echo -e "${GREEN}[Step $step/5] Done.${NC}"
  echo ""
}

# ── Step 0: Create / update the Azure AI Search index ─────────────────────────
if [ "$SKIP_INDEX" = false ]; then
  echo -e "${CYAN}[Step 0/5] ${BOLD}Creating / updating Azure AI Search index...${NC}"
  "$PYTHON" -m app.services.document_loader --index-only
  echo -e "${GREEN}[Step 0/5] Index ready.${NC}"
  echo ""
else
  echo -e "${YELLOW}Skipping index creation (--skip-index passed).${NC}"
  echo ""
fi

# ── Ingestion steps ───────────────────────────────────────────────────────────

echo -e "${BOLD}Starting ingestion...${NC}"
echo -e "${YELLOW}Note: This will take a while — rate limiting adds ~5 s per 16-chunk batch.${NC}"
echo ""

# 1. Cleaned scraped pages (largest batch — ~3,254 files)
run_step 1 "Cleaned scraped web pages (data/scraped_clean)" "data/scraped_clean"

# 2. Student Handbook
run_step 2 "Student Handbook (data/sample)" "data/sample"

# 3. Academic PDFs
run_step 3 "Academic PDFs (data/pdfs)" "data/pdfs"

# 4. Documents folder
run_step 4 "Documents (data/documents)" "data/documents"

# 5. Test / extra documents
run_step 5 "Test documents (data/documents_test)" "data/documents_test"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo -e "${GREEN}${BOLD}   Ingestion complete! TIBU knowledge base is ready.        ${NC}"
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo ""
echo "You can now start the backend:"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""
