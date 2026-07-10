import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import dotenv; dotenv.load_dotenv()
from app.services.document_loader import ingest_documents
print("=== Ingesting PDFs ===")
ingest_documents("./data/pdfs/")
print("=== PDF ingestion complete ===")
