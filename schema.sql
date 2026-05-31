-- ============================================================================
-- Smart GALA-TARI Navigator - Supabase (PostgreSQL + pgvector) Integrated DDL
-- ============================================================================

-- 1. pgvector 및 UUID 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Complexes: 아파트 단지 정보 테이블
CREATE TABLE IF NOT EXISTS complexes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bjd_code VARCHAR(10) NOT NULL, -- 법정동 코드
    address TEXT NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    built_year INTEGER NOT NULL,
    total_households INTEGER NOT NULL,
    current_far NUMERIC(5, 2) NOT NULL, -- 기존 용적률
    current_bcr NUMERIC(5, 2) NOT NULL, -- 기존 건폐율
    average_land_share NUMERIC(5, 2) NOT NULL, -- 평균 대지지분 (평)
    parking_per_household NUMERIC(4, 2) NOT NULL, -- 세대당 주차대수
    heating_type VARCHAR(50) NOT NULL,
    has_subground_elevator BOOLEAN NOT NULL DEFAULT FALSE, -- 지하주차장 엘리베이터 직결 여부
    pediatric_score NUMERIC(4, 1) NOT NULL DEFAULT 50.0,
    childcare_score NUMERIC(4, 1) NOT NULL DEFAULT 50.0,
    flatness_score NUMERIC(4, 1) NOT NULL DEFAULT 50.0,
    park_accessibility_score NUMERIC(4, 1) NOT NULL DEFAULT 50.0,
    noise_safety_score NUMERIC(4, 1) NOT NULL DEFAULT 50.0,
    historical_avg_gap_ratio NUMERIC(4, 2) NOT NULL DEFAULT 0.5,
    reconstruction_announced BOOLEAN NOT NULL DEFAULT FALSE,
    regulation_benefit_factor NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    total_pledges_count INTEGER NOT NULL DEFAULT 0,
    pledge_completed_count INTEGER NOT NULL DEFAULT 0,
    recent_price INTEGER NOT NULL, -- 최근 매매 호가/실거래 기준가 (만원 단위)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 추가로 검색 성능 향상
CREATE INDEX IF NOT EXISTS idx_complexes_bjd ON complexes(bjd_code);
CREATE INDEX IF NOT EXISTS idx_complexes_geom ON complexes(latitude, longitude);

-- 3. Crawled Documents: 수집된 보도자료/고시문 메타 데이터 테이블
CREATE TABLE IF NOT EXISTS crawled_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    source_agency VARCHAR(100) NOT NULL, -- 국토부, 서울시, 교육청 등
    document_type VARCHAR(50) NOT NULL, -- 'pdf', 'article'
    published_date DATE NOT NULL,
    file_size VARCHAR(20),
    original_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Document Chunks: RAG용 임베딩 정보 분할 테이블 (OpenAI Text-Embedding-3-Small 1536차원 기준)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES crawled_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- 1536차원 임베딩 벡터 공간 정의
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- HNSW 인덱스를 사용한 코사인 유사도 검색 인덱싱 최적화
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 5. RAG 유사도 검색을 위한 PostgreSQL Stored Function 정의
CREATE OR REPLACE FUNCTION match_document_chunks (
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    similarity float,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        document_chunks.id,
        document_chunks.document_id,
        document_chunks.content,
        1 - (document_chunks.embedding <=> query_embedding) AS similarity, -- 코사인 거리 역산
        document_chunks.metadata
    FROM document_chunks
    WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY document_chunks.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 초기 고밀도 프리미엄 시딩 데이터 삽입
-- 기존 Complexes 테이블 데이터 정리 후 삽입
TRUNCATE TABLE complexes CASCADE;

-- 상계보람 2단지 정보 적재
INSERT INTO complexes (id, name, bjd_code, address, latitude, longitude, built_year, total_households, current_far, current_bcr, average_land_share, parking_per_household, heating_type, has_subground_elevator, pediatric_score, childcare_score, flatness_score, park_accessibility_score, noise_safety_score, historical_avg_gap_ratio, reconstruction_announced, recent_price)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    '상계보람 2단지',
    '1135010500',
    '서울특별시 노원구 상계동 639',
    37.662491,
    127.067332,
    1988,
    2113,
    197.00,
    15.00,
    14.20,
    0.65,
    '지역',
    FALSE,
    45.5,
    65.0,
    70.0,
    80.0,
    75.0,
    0.35,
    TRUE,
    65000
) ON CONFLICT DO NOTHING;

-- 중계 동진신안 37평형 적재
INSERT INTO complexes (id, name, bjd_code, address, latitude, longitude, built_year, total_households, current_far, current_bcr, average_land_share, parking_per_household, heating_type, has_subground_elevator, pediatric_score, childcare_score, flatness_score, park_accessibility_score, noise_safety_score, historical_avg_gap_ratio, reconstruction_announced, recent_price, regulation_benefit_factor, total_pledges_count, pledge_completed_count)
VALUES (
    'f9e8d7c6-b5a4-3f2e-1d0c-9b8a7f6e5d4c',
    '중계 동진신안 (37평)',
    '1135010600',
    '서울특별시 노원구 중계동 367',
    37.651152,
    127.076841,
    1993,
    468,
    217.00,
    18.00,
    16.50,
    1.47,
    '개별',
    FALSE,
    95.0,
    88.0,
    98.0,
    90.0,
    40.0,
    0.55,
    FALSE,
    98000,
    1.20,
    5,
    2
) ON CONFLICT DO NOTHING;
