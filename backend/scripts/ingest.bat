@echo off
REM =============================================================================
REM TIBU Knowledge Base -- Full Ingestion Pipeline (Windows)
REM =============================================================================
REM Usage (from tibu\backend\):
REM   scripts\ingest.bat               -- full run (all sources)
REM   scripts\ingest.bat --skip-index  -- skip index creation, re-ingest only
REM =============================================================================

setlocal enabledelayedexpansion

cd /d "%~dp0.."

set SKIP_INDEX=0
for %%A in (%*) do (
  if "%%A"=="--skip-index" set SKIP_INDEX=1
)

echo.
echo ============================================================
echo    TIBU -- Azure AI Search Ingestion Pipeline
echo ============================================================
echo.

REM ── Check .env ────────────────────────────────────────────────────────────
if not exist "..\\.env" (
  echo ERROR: .env file not found at tibu\.env
  echo Copy tibu\.env.example to tibu\.env and fill in your Azure credentials.
  exit /b 1
)

REM ── Find Python (venv first) ──────────────────────────────────────────────
set PYTHON=python
if exist ".venv\Scripts\python.exe" set PYTHON=.venv\Scripts\python.exe
if exist "venv\Scripts\python.exe"  set PYTHON=venv\Scripts\python.exe
echo Using Python: %PYTHON%
echo.

REM ── Step 0: Create index ──────────────────────────────────────────────────
if %SKIP_INDEX%==0 (
  echo [Step 0/5] Creating / updating Azure AI Search index...
  %PYTHON% -m app.services.document_loader --index-only
  if errorlevel 1 ( echo ERROR in Step 0 & exit /b 1 )
  echo [Step 0/5] Index ready.
  echo.
) else (
  echo Skipping index creation ^(--skip-index passed^).
  echo.
)

echo Starting ingestion...
echo Note: This will take a while -- rate limiting adds ~5s per 16-chunk batch.
echo.

REM ── Step 1: Cleaned scraped pages ─────────────────────────────────────────
echo [Step 1/5] Cleaned scraped web pages ^(data\scraped_clean^)...
if exist "data\scraped_clean\" (
  %PYTHON% -m app.services.document_loader --path ./data/scraped_clean
  if errorlevel 1 ( echo ERROR in Step 1 & exit /b 1 )
  echo [Step 1/5] Done.
) else (
  echo [Step 1/5] SKIP -- data\scraped_clean not found.
)
echo.

REM ── Step 2: Student Handbook ───────────────────────────────────────────────
echo [Step 2/5] Student Handbook ^(data\sample^)...
if exist "data\sample\" (
  %PYTHON% -m app.services.document_loader --path ./data/sample
  if errorlevel 1 ( echo ERROR in Step 2 & exit /b 1 )
  echo [Step 2/5] Done.
) else (
  echo [Step 2/5] SKIP -- data\sample not found.
)
echo.

REM ── Step 3: Academic PDFs ─────────────────────────────────────────────────
echo [Step 3/5] Academic PDFs ^(data\pdfs^)...
if exist "data\pdfs\" (
  %PYTHON% -m app.services.document_loader --path ./data/pdfs
  if errorlevel 1 ( echo ERROR in Step 3 & exit /b 1 )
  echo [Step 3/5] Done.
) else (
  echo [Step 3/5] SKIP -- data\pdfs not found.
)
echo.

REM ── Step 4: Documents ─────────────────────────────────────────────────────
echo [Step 4/5] Documents ^(data\documents^)...
if exist "data\documents\" (
  %PYTHON% -m app.services.document_loader --path ./data/documents
  if errorlevel 1 ( echo ERROR in Step 4 & exit /b 1 )
  echo [Step 4/5] Done.
) else (
  echo [Step 4/5] SKIP -- data\documents not found.
)
echo.

REM ── Step 5: Test documents ────────────────────────────────────────────────
echo [Step 5/5] Test documents ^(data\documents_test^)...
if exist "data\documents_test\" (
  %PYTHON% -m app.services.document_loader --path ./data/documents_test
  if errorlevel 1 ( echo ERROR in Step 5 & exit /b 1 )
  echo [Step 5/5] Done.
) else (
  echo [Step 5/5] SKIP -- data\documents_test not found.
)
echo.

echo ============================================================
echo    Ingestion complete! TIBU knowledge base is ready.
echo ============================================================
echo.
echo Start the backend with:
echo   uvicorn app.main:app --reload --port 8000
echo.
endlocal
