# -*- coding: utf-8 -*-
"""
Smart GALA-TARI Navigator - Python FastAPI 데이터 크롤링 및 pgvector RAG 적재 파이프라인
"""

import os
import io
import fitz  # PyMuPDF
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.sync_api import sync_playwright
from supabase import create_client, Client
import openai

app = FastAPI(
    title="Smart GALA-TARI Data Pipeline Server",
    description="실시간 정책 고시 PDF 수집 및 pgvector 벡터스토어 RAG 적재 모듈",
    version="1.0.0"
)

# API 연동용 환경변수 정의 (보안 설정)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mock-tenant.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "mock-openai-key")

# Supabase Client 초기화
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    openai.api_key = OPENAI_API_KEY
except Exception as e:
    print(f"Supabase/OpenAI initialization warning: {e}")

class CrawlRequest(BaseModel):
    target_url: str
    agency: str = "서울시 공동주택과"

def chunk_text(text: str, chunk_size: int = 800, chunk_overlap: int = 120):
    """
    RAG 검색 정확도 극대화를 위한 오버랩 기반 슬라이딩 윈도우 텍스트 분할 알고리즘
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - chunk_overlap
    return chunks

@app.get("/")
def health_check():
    return {"status": "HEALTHY", "pipeline": "GALA-TARI DATA INGESTION ENGINE ACTIVE"}

@app.post("/api/v1/crawl-policy")
def crawl_and_embed_policy(request: CrawlRequest):
    """
    정책 고시 사이트의 PDF를 실시간 다운로드하고 파싱한 뒤, pgvector 임베딩 적재를 일괄 처리하는 파이프라인 API
    """
    if SUPABASE_URL == "https://mock-tenant.supabase.co":
        # 로컬 시뮬레이션용 Fallback 모드 작동
        return {
            "status": "MOCK_SUCCESS",
            "document_title": "노원 지구단위 특별정비계획 공고.pdf",
            "chunks_processed": 5,
            "embedded_vectors_injected": 5,
            "db_vector_schema": "pgvector_1536_ready"
        }

    try:
        # 1. Playwright 기반 헤드리스 브라우저 구동 및 파일 다운로드 트리거
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(request.target_url)
            
            # 다운로드 버튼 클릭
            with page.expect_download() as download_info:
                page.click("a.pdf-download-btn") 
                
            download = download_info.value
            pdf_bytes = download.create_read_stream().read()
            filename = download.suggested_filename
            browser.close()
            
        # 2. PyMuPDF(fitz) 라이브러리를 통한 PDF 텍스트 무손실 추출
        pdf_document = fitz.open(stream=io.BytesIO(pdf_bytes), filetype="pdf")
        extracted_text = ""
        for page_num in range(len(pdf_document)):
            extracted_text += pdf_document[page_num].get_text()
            
        # 3. Crawled Document 마스터 레코드 DB 삽입
        doc_data = {
            "title": filename,
            "source_agency": request.agency,
            "document_type": "pdf",
            "published_date": "2026-05-31",
            "file_size": f"{len(pdf_bytes) / (1024*1024):.2f} MB"
        }
        db_doc = supabase.table("crawled_documents").insert(doc_data).execute()
        document_id = db_doc.data[0]['id']
        
        # 4. 청킹 및 OpenAI 1536차원 임베딩 생성 후 pgvector 적재
        chunks = chunk_text(extracted_text)
        for idx, chunk in enumerate(chunks):
            response = openai.Embedding.create(
                input=chunk,
                model="text-embedding-3-small"
            )
            embedding = response['data'][0]['embedding']
            
            chunk_record = {
                "document_id": document_id,
                "content": chunk,
                "embedding": embedding,
                "metadata": {"page": idx + 1, "filename": filename}
            }
            supabase.table("document_chunks").insert(chunk_record).execute()
            
        return {
            "status": "SUCCESS", 
            "document_id": document_id, 
            "document_title": filename, 
            "chunks_processed": len(chunks)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")
