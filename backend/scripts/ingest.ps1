# =============================================================================
# TIBU Knowledge Base -- Full Ingestion Pipeline (PowerShell)
# =============================================================================
# Usage (from tibu\backend\):
#   .\scripts\ingest.ps1               # full run (all sources)
#   .\scripts\ingest.ps1 --skip-index  # skip index creation, re-ingest only
#
# If execution policy blocks the script, run once:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# =============================================================================

param(
    [switch]$SkipIndex
)

$ErrorActionPreference = 'Stop'

# ── Resolve backend directory ─────────────────────────────────────────────────
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir
Set-Location $BackendDir

# ── Colours ───────────────────────────────────────────────────────────────────
function Write-Cyan  ($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Green ($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Yellow($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Red   ($msg) { Write-Host $msg -ForegroundColor Red }

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Cyan  "============================================================"
Write-Cyan  "   TIBU -- Azure AI Search Ingestion Pipeline               "
Write-Cyan  "============================================================"
Write-Host ""

# ── Pre-flight: .env check ────────────────────────────────────────────────────
$EnvFile = Join-Path (Split-Path -Parent $BackendDir) ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Red "ERROR: .env file not found at $EnvFile"
    Write-Host "Copy tibu/.env.example to tibu/.env and fill in your Azure credentials."
    exit 1
}

# ── Find Python (venv first) ──────────────────────────────────────────────────
$Python = "python"
$VenvCandidates = @(
    ".venv\Scripts\python.exe",
    ".venv\bin\python",
    "venv\Scripts\python.exe",
    "venv\bin\python"
)
foreach ($candidate in $VenvCandidates) {
    $full = Join-Path $BackendDir $candidate
    if (Test-Path $full) {
        $Python = $full
        break
    }
}
Write-Green "Using Python: $Python"
Write-Host ""

# ── Helper: run one ingestion step ───────────────────────────────────────────
function Invoke-Step {
    param(
        [string]$StepNum,
        [string]$Label,
        [string]$RelPath,
        [string]$ExtraFlags = ""
    )

    $FullPath = Join-Path $BackendDir $RelPath

    if (-not (Test-Path $FullPath)) {
        Write-Yellow "[Step $StepNum/5] SKIP -- directory not found: $RelPath"
        return
    }

    $FileCount = (Get-ChildItem -Recurse -File $FullPath).Count
    Write-Cyan "[Step $StepNum/5] $Label"
    Write-Host "  Path  : $RelPath"
    Write-Host "  Files : $FileCount"
    Write-Host ""

    $cmd = "$Python -m app.services.document_loader --path ./$RelPath $ExtraFlags".Trim()
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) {
        Write-Red "ERROR in Step $StepNum"
        exit 1
    }

    Write-Host ""
    Write-Green "[Step $StepNum/5] Done."
    Write-Host ""
}

# ── Step 0: Create / update index ────────────────────────────────────────────
if (-not $SkipIndex) {
    Write-Cyan "[Step 0/6] Creating / updating Azure AI Search index..."
    & $Python -m app.services.document_loader --index-only
    if ($LASTEXITCODE -ne 0) { Write-Red "ERROR in Step 0"; exit 1 }
    Write-Green "[Step 0/6] Index ready."
    Write-Host ""
} else {
    Write-Yellow "Skipping index creation (--SkipIndex passed)."
    Write-Host ""
}

# ── Ingestion ─────────────────────────────────────────────────────────────────
Write-Host "Starting ingestion..."
Write-Yellow "Note: This will take a while -- rate limiting adds ~5s per 16-chunk batch."
Write-Host ""

Invoke-Step -StepNum 1 -Label "Cleaned scraped web pages (data/scraped_clean)"       -RelPath "data/scraped_clean"
Invoke-Step -StepNum 2 -Label "Student Handbook (data/sample)"                        -RelPath "data/sample"
Invoke-Step -StepNum 3 -Label "Academic PDFs (data/pdfs)"                             -RelPath "data/pdfs"
Invoke-Step -StepNum 4 -Label "Documents (data/documents)"                            -RelPath "data/documents"
Invoke-Step -StepNum 5 -Label "Course Advising Forms (data/course_advising)"          -RelPath "data/course_advising"
Invoke-Step -StepNum 6 -Label "Test documents (data/documents_test)"                  -RelPath "data/documents_test"

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Green "============================================================"
Write-Green "   Ingestion complete! TIBU knowledge base is ready.        "
Write-Green "============================================================"
Write-Host ""
Write-Host "Start the backend with:"
Write-Host "  uvicorn app.main:app --reload --port 8000"
Write-Host ""
