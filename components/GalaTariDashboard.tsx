'use client';

import React, { useState, useEffect, useRef } from 'react';
import { calculateGalaTariIndex, queryDocumentRAG } from '@/app/actions/galaTari';
import { AlertTriangle, BookOpen, Download, HelpCircle, MapPin, Play, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';

export default function GalaTariDashboard() {
  // 1. 단지 옵션 및 가격 보정 상태
  const [targetId, setTargetId] = useState('shin_an_37');
  const [priceType, setPriceType] = useState<'none' | 'asking_price' | 'actual_price'>('actual_price');
  const [consultingActive, setConsultingActive] = useState(true);

  // 2. 가구 재무 입력 상태
  const [cash, setCash] = useState(20000);
  const [loan, setLoan] = useState(40000);
  const [remodeling, setRemodeling] = useState(6500);
  const [income, setIncome] = useState(9500);

  // 3. 지표 연산 및 경보 상태
  const [calcResult, setCalcResult] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [riskLevel, setRiskLevel] = useState<'SAFE' | 'WARNING' | 'HIGH_DEBT' | 'DANGER'>('SAFE');

  // 4. GIS 안심 레이더 필터 상태 (실제 지도 연동용)
  const [filterPediatric, setFilterPediatric] = useState(true);
  const [filterChildcare, setFilterChildcare] = useState(true);
  const [filterFlatness, setFilterFlatness] = useState(true);

  // 5. Leaflet 실제 지도 객체 관리를 위한 Refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const originMarkerRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const pediatricLayerGroupRef = useRef<any>(null);
  const childcareLayerGroupRef = useRef<any>(null);
  const flatnessLayerGroupRef = useRef<any>(null);

  // 아파트 단지 지리 좌표 정보 (실제 위경도)
  const originCoords: [number, number] = [37.662491, 127.067332]; // 상계보람 2단지
  const targetComplexes: Record<string, { coords: [number, number]; name: string }> = {
    "shin_an_37": { coords: [37.651152, 127.076841], name: "중계 동진신안 (37평)" },
    "shin_an_48": { coords: [37.651152, 127.076841], name: "중계 동진신안 (48평)" },
    "cheong_gu_32": { coords: [37.652131, 127.074312], name: "중계 청구3차 (32평)" },
    "life_cheong_42": { coords: [37.652851, 127.077241], name: "중계 라이프청구 (42평)" }
  };

  // 6. 실시간 정부 정책 고시 PDF & 뉴스 아카이브 게시판 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "Smart GALA-TARI Navigator 수집 엔진 구동 대기 완료...",
    "DB Connection Status: PostgreSQL 15.2 (Localhost) Connected."
  ]);
  const [archiveList, setArchiveList] = useState([
    {
      id: 1,
      type: "pdf",
      agency: "서울시 공동주택과",
      title: "서울시 2030 공동주택 재건축 및 정비계획 용적률 인센티브 통합 실무 지침",
      date: "2026-05-15",
      size: "4.2 MB",
      content: "서울시내 구축 아파트 안전진단 생략 기준 및 역세권 고밀 복합정비구역 용적률 최대 400% 인상 인센티브 적용 상세 규칙 포함."
    },
    {
      id: 2,
      type: "pdf",
      agency: "국토교통부 철도건설과",
      title: "도시철도 동북선 건설공사 실시계획 승인 고시문 및 역사별 출구 배치도",
      date: "2026-04-20",
      size: "12.8 MB",
      content: "노원구 은행사거리역 공정 현황 및 출구 연접 상권 도보 보도정비 세부 실시설계 도면 첨부 완료."
    },
    {
      id: 3,
      type: "pdf",
      agency: "서울시 교육청",
      title: "학군지 거점학교 지정 및 을지초/불암초 반경 어린이 보호구역 안전 보강 대책",
      date: "2026-03-10",
      size: "2.1 MB",
      content: "중계 은행사거리 모범 학군지 내 영유아 보육 인프라 지원 및 보도 평탄화 작업 교육청 보도자료."
    },
    {
      id: 4,
      type: "article",
      agency: "한국경제 부동산",
      title: "[단독] 노원구 주요 역세권 지구단위계획 종상향 통과... 은행사거리 일대 복합개발 급물살",
      date: "2026-05-28",
      size: "450 KB",
      content: "중계동 동진신안, 청구3차, 라이프청구 단지들이 특별정비구역 편입 가능성이 높아지며 매도인 우위 호가 랠리 시작 분석."
    }
  ]);

  // 7. RAG AI 챗봇 게시판 상태
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 8. 선제 갈아타기 전략 리포트 모달 상태
  const [modalActive, setModalActive] = useState(false);

  // A. Leaflet 실제 지도 로딩 및 동적 시각화 라이프사이클 관리
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isCancelled = false;

    // Leaflet JS CDN 동적 스크립트 로드
    const script = document.createElement('script');
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => {
      if (isCancelled) return;
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      // 1. Leaflet 지도 초기화 (상계보람과 중계 은행사거리 중간 지점 기준 렌더링)
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([37.6568, 127.0722], 14);

      mapRef.current = map;

      // 2. 프리미엄 다크 모드 타일맵 (CartoDB Dark Matter) 레이어 장착
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // 레이어 그룹 생성
      pediatricLayerGroupRef.current = L.layerGroup().addTo(map);
      childcareLayerGroupRef.current = L.layerGroup().addTo(map);
      flatnessLayerGroupRef.current = L.layerGroup().addTo(map);

      // 3. 기존 주택 '상계보람 2단지' 퍼플 하이라이트 다각형 및 마커 적재
      const originCircle = L.circle(originCoords, {
        color: '#a855f7',
        fillColor: '#a855f7',
        fillOpacity: 0.25,
        radius: 120
      }).addTo(map);
      
      originCircle.bindPopup("<strong style='color:#a855f7;'>[현재 주택] 상계보람 2단지</strong><br/>용적률: 197% | 대지지분: 14.2평");
      originMarkerRef.current = originCircle;

      // 4. 선택 단지 하이라이팅 기본 드로잉
      const targetData = targetComplexes[targetId];
      const targetCircle = L.circle(targetData.coords, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.35,
        radius: 120
      }).addTo(map);

      targetCircle.bindPopup(`<strong style='color:#3b82f6;'>[목표 상급지] ${targetData.name}</strong><br/>은행사거리 핵심 실수요 입지`);
      targetMarkerRef.current = targetCircle;

      // 5. 최초 지도 로딩 시 데이터 동기화
      refreshMapElements();
      addConsoleLog("GIS 안심 레이더: 실제 OpenStreetMap 지리 공간 데이터 렌더링 완료.", "sys");
    };

    document.head.appendChild(script);

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // B. 드롭다운 필터 변경 시 실제 지도 마커 및 라인 렌더링 리프레시 로직
  const refreshMapElements = () => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    // 기존 레이어 그룹 비우기
    pediatricLayerGroupRef.current.clearLayers();
    childcareLayerGroupRef.current.clearLayers();
    flatnessLayerGroupRef.current.clearLayers();

    // 1. 야간 진료 소아과 마킹 (🏥)
    if (filterPediatric) {
      const pediatricPois = [
        { coords: [37.6516, 127.0762], name: "하늘별소아청소년과의원 (김민식소아과)", desc: "도보 3분 | 밤 10시 진료 | 똑닥 예약 지원" },
        { coords: [37.6495, 127.0748], name: "노원 을지소아과의원", desc: "도보 5분 | 공휴일 진료" },
        { coords: [37.6410, 127.0718], name: "하계 노원을지대학교병원 (야간 응급의료)", desc: "차량 7분 | 대학병원 응급 진료" }
      ];

      pediatricPois.forEach(poi => {
        L.circleMarker(poi.coords, {
          radius: 8,
          fillColor: '#f59e0b',
          color: '#ffffff',
          weight: 1.5,
          fillOpacity: 0.95
        }).addTo(pediatricLayerGroupRef.current)
          .bindPopup(`<strong>🏥 ${poi.name}</strong><br/>${poi.desc}`);
      });
    }

    // 2. 국공립 어린이집 마킹 (🧸)
    if (filterChildcare) {
      const childcarePois = [
        { coords: [37.6531, 127.0754], name: "국공립 중계1동어린이집", desc: "동진신안 단지 인근 | 입소대기 추천" },
        { coords: [37.6618, 127.0682], name: "보람어린이집", desc: "보람아파트 단지 내 보육망" },
        { coords: [37.6525, 127.0776], name: "중계 을지유치원", desc: "학군지 연계 안정적 유치원" }
      ];

      childcarePois.forEach(poi => {
        L.circleMarker(poi.coords, {
          radius: 8,
          fillColor: '#a855f7',
          color: '#ffffff',
          weight: 1.5,
          fillOpacity: 0.95
        }).addTo(childcareLayerGroupRef.current)
          .bindPopup(`<strong>🧸 ${poi.name}</strong><br/>${poi.desc}`);
      });
    }

    // 3. 유모차 평지 보행로 실노선 드로잉 (🏃)
    if (filterFlatness) {
      // 은행사거리 한글비석로 및 중계로 실제 도로망 매핑
      const path1 = [
        [37.6560, 127.0765],
        [37.6480, 127.0765]
      ];
      const path2 = [
        [37.6515, 127.0710],
        [37.6515, 127.0810]
      ];

      L.polyline(path1, { color: '#10b981', weight: 5, opacity: 0.75 }).addTo(flatnessLayerGroupRef.current)
        .bindPopup("🏃 [유모차 안심 보도] 한글비석로 완전 평탄 구간 (경사 0도)");
      L.polyline(path2, { color: '#10b981', weight: 5, opacity: 0.75 }).addTo(flatnessLayerGroupRef.current)
        .bindPopup("🏃 [유모차 안심 보도] 중계로 격자형 평지 산책 동선");
    }
  };

  // 필터 토글 감지
  useEffect(() => {
    refreshMapElements();
  }, [filterPediatric, filterChildcare, filterFlatness]);

  // C. 드롭다운 선택 단지 변경 시 실제 지도의 중심 위치 flyTo 이동 & 하이라이팅 변경
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !targetMarkerRef.current) return;

    const targetData = targetComplexes[targetId];
    
    // 타겟 마커 위치 변경 및 팝업 재바인딩
    targetMarkerRef.current.setLatLng(targetData.coords);
    targetMarkerRef.current.bindPopup(`<strong style='color:#3b82f6;'>[목표 상급지] ${targetData.name}</strong><br/>실시간 갈아타기 가치 점수 연동`);

    // 선택 단지로 비행 카메라 이동
    mapRef.current.flyTo(targetData.coords, 15, {
      animate: true,
      duration: 1.2
    });

    addConsoleLog(`GIS: 지도 카메라 줌 락 완료 ➡️ [${targetData.name}] 위경도 좌표 이동`, "sys");
  }, [targetId]);

  // D. 실시간 DSR 연산 백엔드 동기화
  useEffect(() => {
    async function runCalculation() {
      try {
        const res = await calculateGalaTariIndex(
          'bo-ram-uuid-1111',
          targetId,
          {
            cash_on_hand: cash,
            current_mortgage_balance: 15000,
            max_available_loan: loan,
            expected_remodeling_cost: remodeling,
            annual_income: income,
            price_correction_type: priceType
          },
          consultingActive
        );
        setCalcResult(res);

        const net = res.financial_analysis.net_margin;
        const dsr = res.financial_analysis.debt_to_income_ratio;
        
        let level: 'SAFE' | 'WARNING' | 'HIGH_DEBT' | 'DANGER' = 'SAFE';
        const msgs: string[] = [];

        if (net < 0) {
          level = 'DANGER';
          msgs.push(`자금 부족: 약 <strong>${Math.abs(net).toLocaleString()}만원</strong>의 추가 자금 확보가 절실합니다.`);
        } else if (net < 5000) {
          level = 'WARNING';
          msgs.push("자금 여유 부족: 인테리어 마감 오차 및 취득세 완납 시 비상 예비금이 부족합니다.");
        }

        if (dsr > 4.5) {
          if (level !== 'DANGER') level = 'HIGH_DEBT';
          msgs.push(`과도한 DSR 부채 위험: 연 소득 대비 대출 규모 비율(${dsr.toFixed(1)}배)이 무리한 수준입니다.`);
        }

        setRiskLevel(level);
        setWarnings(msgs);

      } catch (err: any) {
        addConsoleLog(`Error calculating indices: ${err.message}`, "err");
      }
    }
    runCalculation();
  }, [targetId, priceType, consultingActive, cash, loan, remodeling, income]);

  const handleRAGQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    setIsSearching(true);
    addConsoleLog(`RAG Query Initiated: "${chatQuery}"`, "cmd");
    const answer = await queryDocumentRAG(chatQuery);
    setChatResponse(answer);
    setIsSearching(false);
    addConsoleLog("RAG Semantic Policy Search & Response Synthesis Completed.", "sys");
  };

  const handleManualCrawl = () => {
    if (crawlStep >= 2) {
      addConsoleLog("Crawler: 신규 크롤링 할 정부 고시 정책 문서가 존재하지 않습니다.", "sys");
      alert("이미 모든 최신 정부 공고 데이터가 동기화 완료되었습니다.");
      return;
    }

    const sc = [
      {
        source: "국토교통부 보도자료",
        type: "pdf",
        title: "재건축 패스트트랙 특별법 입법 고시 및 안전진단 완전 생략 가이드라인",
        date: "2026-05-31",
        size: "8.7 MB",
        content: "안전진단 단계 생략 및 통합심의 간소화로 상급지 구축 재건축 정비사업 조합 설립 속도 3년 이상 단축 정책."
      },
      {
        source: "서울시 도시안전본부",
        type: "pdf",
        title: "2026 노원구 은행사거리 지하차도 및 평탄화 유모차 안심 보도정비 중장기 계획",
        date: "2026-05-31",
        size: "1.9 MB",
        content: "유모차 및 어린이 도행 보호를 위한 턱 낮추기 작업 및 보도 블록 친환경 아스팔트 교체 공사 안내."
      }
    ][crawlStep];

    setArchiveList(prev => [
      {
        id: prev.length + 1,
        type: sc.type,
        agency: sc.source,
        title: sc.title,
        date: sc.date,
        size: sc.size,
        content: sc.content
      },
      ...prev
    ]);

    addConsoleLog(`Crawler: [${sc.source}] 주관 "${sc.title}" 다운로드 완료 & RAG 임베딩 DB 적재 완료`, "sys");
    setCrawlStep(prev => prev + 1);
  };

  const [crawlStep, setCrawlStep] = useState(0);

  const handleDbSeeding = () => {
    addConsoleLog("SQL execution: complexes, infra_scores 데이터 시딩 수행 완료.", "sys");
    alert("PostgreSQL complexes & infra_scores 마스터 데이터 세션이 초기 시딩 및 복원되었습니다.");
  };

  const filteredArchive = archiveList.filter(item => 
    item.title.includes(searchKeyword) || 
    item.agency.includes(searchKeyword) || 
    item.content.includes(searchKeyword)
  );

  return (
    <main className="space-y-8">
      
      {/* 1. Live Alert Monitoring Panel */}
      <section className="bg-glass-heavy backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold border-l-4 border-primary pl-3 text-text-pure flex items-center gap-2">
            실시간 크롤링 & 모니터링 경보판
          </h2>
          <span className="px-2 py-0.5 bg-danger/10 border border-danger text-danger text-[10px] font-black rounded tracking-widest animate-pulse">
            LIVE UPDATES
          </span>
        </div>

        <div className="space-y-3 max-h-40 overflow-y-auto">
          <div className="bg-slate-950/40 border-l-4 border-warning rounded-r-lg p-3 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="px-1.5 py-0.5 bg-warning/10 text-warning border border-warning/20 font-bold rounded">의료/육아</span>
              <span className="text-slate-200">중계 은행사거리 중심가 <strong>'하늘별소아청소년과'</strong> 똑닥 주말 연장진료 데이터 정상 수집</span>
            </div>
            <span className="text-text-muted">방금 전</span>
          </div>
          <div className="bg-slate-950/40 border-l-4 border-primary rounded-r-lg p-3 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 font-bold rounded">교통/공약</span>
              <span className="text-slate-200">노원 교통 공약 <strong>'도시철도 동북선 경전철 공정률 92% 준공'</strong> 이행 단계 진입 크롤링 완료</span>
            </div>
            <span className="text-text-muted">12분 전</span>
          </div>
          <div className="bg-slate-950/40 border-l-4 border-success rounded-r-lg p-3 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="px-1.5 py-0.5 bg-success/10 text-success border border-success/20 font-bold rounded">정비계획</span>
              <span className="text-slate-200">서울시 노원지구단위계획 구역 종상향 용적률 완화 인센티브 상세 고시문 파싱 완료</span>
            </div>
            <span className="text-text-muted">32분 전</span>
          </div>
        </div>
      </section>

      {/* 2. Main Double-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Matchmaker & Calculators (7 Columns) */}
        <div className="lg:col-span-7 bg-glass border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-xl relative">
          <h2 className="text-xl font-bold border-l-4 border-primary pl-3 text-text-pure">1:1 상급지 갈아타기 매치 메이커</h2>
          
          {/* Dropdown Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">갈아타기 목표 상급지 단지/평형 선택</label>
              <select 
                value={targetId} 
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer transition-colors"
              >
                <option value="shin_an_37">중계 동진신안 (37평 / 전용 101㎡) - 미발표</option>
                <option value="shin_an_48">중계 동진신안 (48평 / 전용 134㎡) - 미발표</option>
                <option value="cheong_gu_32">중계 청구3차 (32평 / 전용 84㎡) - 재건축 확정</option>
                <option value="life_cheong_42">중계 라이프청구 (42평 / 전용 115㎡) - 재건축 확정</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">상계보람 2단지 매매 시세 보정</label>
              <select 
                value={priceType} 
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold focus:border-primary focus:outline-none cursor-pointer transition-colors"
              >
                <option value="actual_price">실거래가 기준 +1.0억 가산 보정</option>
                <option value="asking_price">호가 시세 기준 +1.7억 가산 보정</option>
                <option value="none">보정 없음 (매수 원가격)</option>
              </select>
            </div>
          </div>

          {/* Complexes Display Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
            
            <div className="sm:col-span-5 bg-slate-950/50 border border-slate-900 rounded-2xl p-4 space-y-1 hover:border-secondary transition-all">
              <div className="text-[10px] text-secondary font-extrabold uppercase tracking-widest">현재 보유 및 거주 단지</div>
              <div className="text-sm font-bold text-text-high">상계보람 2단지</div>
              <div className="text-xl font-extrabold text-text-pure">
                {calcResult ? `${Math.round(calcResult.correctedOriginPrice).toLocaleString()} 만원` : "65,000 만원"}
              </div>
            </div>

            <div className="sm:col-span-1 text-center font-black text-slate-700 text-sm">VS</div>

            <div className="sm:col-span-5 bg-slate-950/50 border border-slate-900 rounded-2xl p-4 space-y-1 hover:border-primary transition-all">
              <div className="text-[10px] text-primary font-extrabold uppercase tracking-widest">갈아타기 추천 단지</div>
              <div className="text-sm font-bold text-text-high">
                {targetId === 'shin_an_37' ? '중계 동진신안 (37평)' : 
                 targetId === 'shin_an_48' ? '중계 동진신안 (48평)' : 
                 targetId === 'cheong_gu_32' ? '중계 청구3차 (32평)' : '중계 라이프청구 (42평)'}
              </div>
              <div className="text-xl font-extrabold text-text-pure">
                {targetId === 'shin_an_37' ? '98,000 만원' : 
                 targetId === 'shin_an_48' ? '125,000 만원' : 
                 targetId === 'cheong_gu_32' ? '105,000 만원' : '118,000 만원'}
              </div>
            </div>

          </div>

          {/* GALA-TARI INDEX Showcase Dial */}
          {calcResult && (
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/40 border border-slate-900 rounded-2xl p-5 shadow-inner">
              <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="46" className="fill-none stroke-slate-900 stroke-[8px]"></circle>
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="46" 
                    className="fill-none stroke-primary stroke-[8px] transition-all duration-1000"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (calcResult.galaTariIndex / 100) * 289}
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-text-pure">{calcResult.galaTariIndex}</span>
                  <span className="block text-[8px] text-text-muted font-bold uppercase">Index</span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-md inline-block ${calcResult.isSafe ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {calcResult.isSafe ? '상급지 갈아타기 추천 타당' : '재무 추가조정 후 이주 검토'}
                </span>
                <p className="text-xs text-text-high leading-relaxed">
                  {targetId.startsWith("shin_an") ? 
                    "은행사거리의 압도적인 야간 진료 소아과망 및 보도 평탄화 인프라 수혜를 누립니다. 단, 지하주차장 미연결 동선 특성을 사전 체크하세요." :
                    "지하주차장 엘리베이터 직결 단지로 영유아 보행 쾌적성은 최상이나, 재건축 선반영 거품 가격으로 예산 마진 확보에 집중하십시오."}
                </p>
              </div>
            </div>
          )}

          {/* 선제적 갈아타기 컨설팅 전용 카드 */}
          <div className="bg-gradient-to-r from-purple-900/15 to-slate-950/80 border border-dashed border-secondary rounded-2xl p-5 shadow-lg relative">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-text-pure flex items-center gap-1.5">
                🔮 재건축 결정 고시(기사) 전 선제 갈아타기 전략 모드
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={consultingActive}
                  onChange={(e) => setConsultingActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
            <p className="text-xs text-text-mid leading-relaxed mb-4">
              언론 보도 및 재건축 고시 기사가 대외 송출되어 시장 호가가 랠리를 보이기 전, 최저의 갭 격차 구간을 포착하여 가산 적용합니다.
            </p>
            <button 
              onClick={() => setModalActive(true)}
              className="w-full bg-secondary hover:bg-secondary/80 text-slate-950 font-black py-2.5 rounded-xl text-xs tracking-wider transition-all shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)] animate-pulse"
            >
              선제 매수 타이밍 정밀 보고서 출력
            </button>
          </div>

          {/* Metric detail bars */}
          {calcResult && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">지표 세부 스펙 분석</h3>
              
              <div className="space-y-3">
                <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>📈 정비사업성 및 미래 가치</span>
                    <span className="text-primary font-bold">{calcResult.investment_value_breakdown.business_score.toFixed(1)} / 30.0</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(calcResult.investment_value_breakdown.business_score / 30) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>👶 의료 및 어린이집 보육 인프라</span>
                    <span className="text-warning font-bold">{calcResult.living_value_breakdown.care_score.toFixed(1)} / 15.0</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: `${(calcResult.living_value_breakdown.care_score / 15) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>🛒 유모차 평지 보행성 & 주차 직결</span>
                    <span className="text-success font-bold">{calcResult.living_value_breakdown.mobility_score.toFixed(1)} / 15.0</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${(calcResult.living_value_breakdown.mobility_score / 15) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DSR Budget Stress panel */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-high">DSR 가구 재무 스트레스 테스트</h3>
              <span className={`px-2 py-0.5 text-[10px] font-black rounded ${
                riskLevel === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                riskLevel === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {riskLevel === 'SAFE' ? '재무 안정적' : riskLevel === 'WARNING' ? '자금 주의' : '위험 등급 경보'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>가용 현금</span>
                  <span className="font-bold text-text-high">{cash.toLocaleString()}만원</span>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="50000" 
                  step="500" 
                  value={cash} 
                  onChange={(e) => setCash(Number(e.target.value))}
                  className="w-full accent-primary bg-slate-900" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>확보 가능 신규 대출</span>
                  <span className="font-bold text-text-high">{loan.toLocaleString()}만원</span>
                </div>
                <input 
                  type="range" 
                  min="10000" 
                  max="60000" 
                  step="1000" 
                  value={loan} 
                  onChange={(e) => setLoan(Number(e.target.value))}
                  className="w-full accent-primary bg-slate-900" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>37/42평 올수리 리모델링비</span>
                  <span className="font-bold text-text-high">{remodeling.toLocaleString()}만원</span>
                </div>
                <input 
                  type="range" 
                  min="2000" 
                  max="12000" 
                  step="100" 
                  value={remodeling} 
                  onChange={(e) => setRemodeling(Number(e.target.value))}
                  className="w-full accent-primary bg-slate-900" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>합산 연 소득 (DSR)</span>
                  <span className="font-bold text-text-high">{income.toLocaleString()}만원</span>
                </div>
                <input 
                  type="range" 
                  min="3000" 
                  max="25000" 
                  step="500" 
                  value={income} 
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full accent-primary bg-slate-900" 
                />
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="bg-danger/10 border border-dashed border-danger/30 rounded-xl p-3 text-xs text-red-400 space-y-1">
                {warnings.map((w, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <ShieldAlert size={14} className="flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: w }}></span>
                  </div>
                ))}
              </div>
            )}

            {calcResult && (
              <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 text-center">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-text-muted uppercase font-bold">필요 총 자금</div>
                  <div className="text-sm font-extrabold text-text-high">{calcResult.financial_analysis.required_capital.toLocaleString()} <span className="text-[10px] text-text-muted font-normal">만원</span></div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-text-muted uppercase font-bold">조달 가능 자산</div>
                  <div className="text-sm font-extrabold text-text-high">{calcResult.financial_analysis.available_resources.toLocaleString()} <span className="text-[10px] text-text-muted font-normal">만원</span></div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-text-muted uppercase font-bold">순 예산 여유마진</div>
                  <div className={`text-sm font-extrabold ${calcResult.financial_analysis.net_margin >= 0 ? 'text-success' : 'text-danger'}`}>
                    {calcResult.financial_analysis.net_margin >= 0 ? `+${calcResult.financial_analysis.net_margin.toLocaleString()}` : calcResult.financial_analysis.net_margin.toLocaleString()} 
                    <span className="text-[10px] text-text-muted font-normal"> 만원</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: GIS 실제 지도 레이더 & Developer Console & AI RAG (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* GIS Map Radar (실제 구글맵/OpenStreetMap dark 연동) */}
          <div className="bg-glass border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl relative">
            <h2 className="text-lg font-bold border-l-4 border-primary pl-3 text-text-pure">은행사거리 안심 레이더 (실시간 GIS)</h2>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilterPediatric(prev => !prev)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  filterPediatric ? 'bg-warning/10 border border-warning text-warning shadow-[0_0_10px_-3px_rgba(245,158,11,0.4)]' : 'bg-slate-900 text-text-muted border border-slate-800'
                }`}
              >
                🏥 야간 소아과
              </button>
              <button 
                onClick={() => setFilterChildcare(prev => !prev)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  filterChildcare ? 'bg-secondary/10 border border-secondary text-secondary shadow-[0_0_10px_-3px_rgba(168,85,247,0.4)]' : 'bg-slate-900 text-text-muted border border-slate-800'
                }`}
              >
                🧸 국공립 어린이집
              </button>
              <button 
                onClick={() => setFilterFlatness(prev => !prev)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  filterFlatness ? 'bg-success/10 border border-success text-success shadow-[0_0_10px_-3px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-text-muted border border-slate-800'
                }`}
              >
                🏃 유모차 평지 보행로
              </button>
            </div>

            {/* 실제 지도가 로드되어 그려지는 Leaflet Map Viewport Container */}
            <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-950/60">
              <div 
                ref={mapContainerRef} 
                className="w-full h-80 bg-slate-950/80"
                style={{ zIndex: 1 }}
              ></div>
              
              <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-[8px] text-text-muted z-[1000] pointer-events-none">
                CartoDB / OpenStreetMap
              </div>
            </div>
            
            <div className="gis-legend text-[10px] text-text-muted border-t border-slate-800 pt-3 flex justify-between">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> 보람 2단지 (현재)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> 갈아타기 대상 (타겟)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warning"></span> 야간 소아과</span>
            </div>
          </div>

          {/* AI Policy RAG Chatbot */}
          <div className="bg-glass border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold border-l-4 border-secondary pl-3 text-text-pure">AI 정책 RAG 챗봇 게시판</h2>
            <p className="text-xs text-text-muted">수집된 서울시/국토부 공식 고시문 텍스트를 실시간 시맨틱 임베딩 매칭하여 최신 요약을 도출합니다.</p>
            
            <form onSubmit={handleRAGQuery} className="flex gap-2">
              <input 
                type="text" 
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="예: 이번 노원구 용적률 인센티브 지침이 뭐야?"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:border-secondary focus:outline-none placeholder:text-slate-600 text-text-high"
              />
              <button 
                type="submit"
                disabled={isSearching}
                className="bg-secondary hover:bg-secondary/80 disabled:bg-slate-800 text-slate-950 font-black px-4 rounded-xl text-xs transition-colors"
              >
                {isSearching ? '검색중...' : '조회'}
              </button>
            </form>

            {chatResponse && (
              <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-4 text-xs space-y-2 leading-relaxed">
                <div className="font-extrabold text-secondary flex items-center gap-1.5">
                  <BookOpen size={14} /> AI RAG 정책 매칭 분석 보고서 (3줄 요약):
                </div>
                <div className="whitespace-pre-line text-slate-200">{chatResponse}</div>
              </div>
            )}
          </div>

          {/* Scraper / SQL DB Developer Console */}
          <div className="bg-glass-heavy border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold border-l-4 border-primary pl-3 text-text-pure">실시간 크롤링 및 DB 상태 콘솔</h2>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleManualCrawl}
                className="bg-primary hover:bg-primary/80 text-slate-950 font-black py-2 rounded-lg text-[10px] tracking-wider transition-colors"
              >
                🚀 크롤러 수동 가동 시뮬레이션
              </button>
              <button 
                onClick={handleDbSeeding}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-text-high font-bold py-2 rounded-lg text-[10px] tracking-wider transition-colors"
              >
                💾 PostgreSQL 시딩 SQL 구동
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[10px] text-text-mid h-32 overflow-y-auto space-y-1">
              {consoleLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={log.includes("⚙️") ? "text-success" : log.includes("❌") ? "text-danger" : "text-primary"}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 3. Bottom Policy PDF Archive Board */}
      <section className="bg-glass border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-bold border-l-4 border-primary pl-3 text-text-pure">📰 실시간 정부 고시 & 뉴스 보도자료 아카이브</h2>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-600" size={16} />
            <input 
              type="text" 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="아카이브된 고시 기관명 또는 정책 키워드를 입력하세요 (예: 용적률, 동북선, 교육청)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:border-primary focus:outline-none placeholder:text-slate-600 text-text-high"
            />
          </div>
        </div>

        <div className="border border-slate-850 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-text-muted font-bold">
                  <th className="p-3">발행/크롤링 기관</th>
                  <th className="p-3">정책자료 명세 및 세부 고시 요약</th>
                  <th className="p-3">공표 일자</th>
                  <th className="p-3 text-center">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredArchive.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-text-muted">검색된 정책자료가 없습니다.</td>
                  </tr>
                ) : (
                  filteredArchive.map(item => (
                    <tr key={item.id} className="border-b border-slate-850 hover:bg-slate-900/20 transition-colors">
                      <td className="p-3 font-bold text-text-high">{item.agency}</td>
                      <td className="p-3 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {item.type === 'pdf' ? (
                            <span className="px-1.5 py-0.5 bg-danger/10 text-danger border border-danger/25 font-bold rounded text-[8px] uppercase">PDF 고시</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/25 font-bold rounded text-[8px] uppercase">기사</span>
                          )}
                          <span className="font-bold text-text-pure">{item.title}</span>
                        </div>
                        <p className="text-text-muted text-[10px] leading-relaxed">{item.content}</p>
                      </td>
                      <td className="p-3 text-text-muted">{item.date}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => {
                            addConsoleLog(`Archive: [${item.title}] ${item.type === 'pdf' ? '정부 원본 고시 PDF 실시간 로드 성공' : '기사 원문 탭 연결 완료'}`, "sys");
                            alert(`[${item.agency} 검증완료]\n자료: ${item.title}\n\n세부내용: ${item.content}`);
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-primary hover:text-slate-950 border border-slate-800 hover:border-primary text-text-muted text-[10px] font-bold rounded transition-all flex items-center gap-1.5 mx-auto"
                        >
                          <Download size={10} /> {item.type === 'pdf' ? '다운로드' : '이동'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Fullscreen Blur Modal overlay (Consulting details) */}
      <div className={`fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[5000] flex items-center justify-center p-4 transition-all duration-300 ${
        modalActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`bg-slate-900 border border-secondary rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl transform transition-transform duration-300 relative ${
          modalActive ? 'translate-y-0' : 'translate-y-8'
        }`}>
          <button 
            onClick={() => setModalActive(false)}
            className="absolute top-4 right-4 text-text-muted hover:text-text-pure transition-colors"
          >
            <X size={20} />
          </button>

          {targetId.includes("cheong_gu") || targetId.includes("life") ? (
            <div className="space-y-3">
              <h3 className="text-lg font-black text-primary flex items-center gap-1.5">
                <AlertTriangle /> 정비구역 확정 발표 단지 알림
              </h3>
              <p className="text-xs text-text-high leading-relaxed">
                선택하신 <strong>중계 청구3차/라이프청구</strong> 아파트는 이미 공식 정비사업 조합설립 단계 및 재건축 최종 승인 공시 기사가 배포 완료되었습니다.
              </p>
              <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-[11px] text-red-300 leading-relaxed font-semibold">
                [시장 호가 선반영 거품 주의]<br/>
                현재 시세 평당 단가에는 미래 가치 프리미엄이 100% 선반영되어 갭의 격차가 크게 확대되어 있습니다. 자금 마진 조율 시 보람아파트 실거래가 상승 혜택 대비 추가 필요 신용 대출 버퍼를 최대치로 산출하십시오.
              </div>
              <p className="text-[10px] text-text-muted">
                * 권장조언: 아직 정비 고시 보도 기사가 나가지 않은 저평가 대체 복합정비 수혜 단지군(예: 동진신안 37평 등)을 선제 매수하는 대안을 포착하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-black text-secondary flex items-center gap-1.5">
                ✨ 재건축 공시 전 선제 갈아타기 전략 보고서
              </h3>
              <p className="text-xs text-text-high leading-relaxed">
                선택하신 <strong>중계 동진신안 아파트</strong>는 학원가 평탄 지형 실수요가 탄탄하나, 아직 공식 특별재건축 구역 고시 기사 보도가 유출되기 전 단계인 **'최적의 선제 진입 구간'**입니다.
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-[11px] text-emerald-300 space-y-1.5">
                <div className="font-bold">- 선제 매수 투자 타이밍 등급: [최우수]</div>
                <div>- 갭 격차 지수: 역사적 저평가 임계점 수렴 중</div>
                <div>- 정책 공시 모멘텀 가산 보너스 점수: **+5.0점 전격 반영 완료**</div>
                <div>- 공시 발표 후 예상 호가 프리미엄 상승률: **최소 +1.5억 ~ 2억 즉각 상승 예측**</div>
              </div>
              <p className="text-[10px] text-text-muted">
                * 의사결정 전략: 상계보람 2단지 매매 시세 상승분(1억 차익)을 활용하여, 언론 보도로 호가가 완전히 랠리를 개시하기 전 선제 매입을 결정하는 것이 가구 자산 증식 설계 관점에서 절대적 우위를 가집니다.
              </p>
            </div>
          )}

          <button 
            onClick={() => setModalActive(false)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-text-pure py-2 rounded-xl text-xs font-bold transition-colors"
          >
            확인 및 리포트 닫기
          </button>
        </div>
      </div>

    </main>
  );
}
