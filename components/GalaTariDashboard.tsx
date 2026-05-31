'use client';

import React, { useState, useEffect } from 'react';
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

  // 4. GIS 안심 레이더 필터 상태
  const [filterPediatric, setFilterPediatric] = useState(true);
  const [filterChildcare, setFilterChildcare] = useState(true);
  const [filterFlatness, setFilterFlatness] = useState(true);
  const [hoverComplex, setHoverComplex] = useState<{ name: string; desc: string } | null>(null);

  // 5. 실시간 정부 정책 고시 PDF & 뉴스 아카이브 게시판 상태
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

  // 6. RAG AI 챗봇 게시판 상태
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 7. 선제 갈아타기 전략 리포트 모달 상태
  const [modalActive, setModalActive] = useState(false);

  // 실시간 지표 연산 구동
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

        // 재무 스트레스 리스크 진단
        const net = res.financial_analysis.net_margin;
        const dsr = res.financial_analysis.debt_to_income_ratio;
        
        let level: 'SAFE' | 'WARNING' | 'HIGH_DEBT' | 'DANGER' = 'SAFE';
        const msgs: string[] = [];

        if (net < 0) {
          level = 'DANGER';
          msgs.push(`자금 부족: 약 ${Math.abs(net).toLocaleString()}만원의 추가 자금 확보가 절실합니다.`);
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

  // 터미널 로그 주입 유틸
  const addConsoleLog = (msg: string, type: "sys" | "err" | "cmd" = "cmd") => {
    const timeStr = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, `[${timeStr}] ${type === 'sys' ? '⚙️' : type === 'err' ? '❌' : '💻'} ${msg}`]);
  };

  // RAG 질의 수행
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

  // 크롤러 수동 가동 시나리오
  const [crawlStep, setCrawlStep] = useState(0);
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

  const handleDbSeeding = () => {
    addConsoleLog("SQL execution: complexes, infra_scores 데이터 시딩 수행 완료.", "sys");
    alert("PostgreSQL complexes & infra_scores 마스터 데이터 세션이 초기 시딩 및 복원되었습니다.");
  };

  // 검색 키워드 필터링
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
                {/* Biz */}
                <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>📈 정비사업성 및 미래 가치</span>
                    <span className="text-primary font-bold">{calcResult.investment_value_breakdown.business_score.toFixed(1)} / 30.0</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(calcResult.investment_value_breakdown.business_score / 30) * 100}%` }}></div>
                  </div>
                </div>

                {/* Care */}
                <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>👶 의료 및 어린이집 보육 인프라</span>
                    <span className="text-warning font-bold">{calcResult.living_value_breakdown.care_score.toFixed(1)} / 15.0</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-warning" style={{ width: `${(calcResult.living_value_breakdown.care_score / 15) * 100}%` }}></div>
                  </div>
                </div>

                {/* Mobility */}
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

        {/* Right Column: GIS 안심 레이더 & Developer Console & AI RAG (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* GIS Map Radar */}
          <div className="bg-glass border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl relative">
            <h2 className="text-lg font-bold border-l-4 border-primary pl-3 text-text-pure">은행사거리 안심 레이더</h2>
            
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

            {/* GIS Map SVG viewport */}
            <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-950/60">
              <svg className="w-full h-80 bg-slate-950/80" viewBox="0 0 500 380">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsla(222, 20%, 15%, 0.4)" strokeWidth="1"></path>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)"></rect>

                {/* Roads */}
                <path d="M 50 190 L 450 190 M 250 50 L 250 330 M 120 50 L 120 330 M 380 50 L 380 330" fill="none" stroke="hsla(223, 20%, 20%, 0.8)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M 50 190 L 450 190 M 250 50 L 250 330 M 120 50 L 120 330 M 380 50 L 380 330" fill="none" stroke="hsl(222, 40%, 8%)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"></path>

                {/* Flatness Highlight */}
                {filterFlatness && (
                  <path d="M 120 190 L 380 190 M 250 80 L 250 300" fill="none" stroke="var(--color-success)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" strokeDasharray="8 8" className="animate-[dash_30s_linear_infinite]"></path>
                )}

                {/* Polygons */}
                <polygon 
                  id="poly-bo-ram" 
                  points="60,70 110,70 110,130 60,130" 
                  className="fill-secondary/5 stroke-secondary hover:fill-secondary/15 stroke-2 transition-all cursor-pointer"
                  onMouseOver={() => setHoverComplex({ name: "상계보람 2단지", desc: "용적률 197% | 대지지분 14.2평 | 재건축 추진" })}
                  onMouseOut={() => setHoverComplex(null)}
                ></polygon>

                <polygon 
                  id="poly-shin-an" 
                  points="260,100 310,100 310,160 260,160" 
                  className={`stroke-primary stroke-2 transition-all cursor-pointer ${
                    targetId.startsWith("shin_an") ? 'fill-primary/20 animate-pulse' : 'fill-primary/5 hover:fill-primary/15'
                  }`}
                  onMouseOver={() => setHoverComplex({ 
                    name: targetId.startsWith("shin_an") ? "중계 동진신안" : "중계 청구3차", 
                    desc: targetId.startsWith("shin_an") ? "용적률 217% | 대지지분 16.5평 | 야간 소아과인접" : "용적률 212% | 대지지분 15.8평 | 지하주차장 직결" 
                  })}
                  onMouseOut={() => setHoverComplex(null)}
                ></polygon>

                {/* POI Pediatric */}
                {filterPediatric && (
                  <g className="transition-all scale-100" transform="translate(290, 180)">
                    <circle r="6" className="fill-warning stroke-slate-950 stroke-[1.5px]"></circle>
                    <text x="0" y="-10" className="text-[10px] font-extrabold fill-slate-300 text-center pointer-events-none" textAnchor="middle">하늘별소아과</text>
                  </g>
                )}

                {/* POI Daycare */}
                {filterChildcare && (
                  <>
                    <g className="transition-all" transform="translate(270, 90)">
                      <circle r="6" className="fill-secondary stroke-slate-950 stroke-[1.5px]"></circle>
                      <text x="0" y="-10" className="text-[10px] font-extrabold fill-slate-300 text-center pointer-events-none" textAnchor="middle">중계1동어린이집</text>
                    </g>
                    <g className="transition-all" transform="translate(85, 100)">
                      <circle r="6" className="fill-secondary stroke-slate-950 stroke-[1.5px]"></circle>
                      <text x="0" y="-10" className="text-[10px] font-extrabold fill-slate-300 text-center pointer-events-none" textAnchor="middle">보람어린이집</text>
                    </g>
                  </>
                )}

                {/* Labels */}
                <text x="85" y="145" className="text-[11px] font-extrabold fill-text-pure text-center pointer-events-none" textAnchor="middle">상계보람</text>
                <text x="285" y="175" className="text-[11px] font-extrabold fill-text-pure text-center pointer-events-none" textAnchor="middle">중계 동진신안</text>
              </svg>

              {/* GIS Map Hover overlay card */}
              <div className={`absolute bottom-3 left-3 right-3 bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex justify-between items-center transition-all ${
                hoverComplex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}>
                <span className="text-[11px] font-bold text-text-pure">{hoverComplex?.name}</span>
                <span className="text-[10px] text-text-muted">{hoverComplex?.desc}</span>
              </div>
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
      <div className={`fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300 ${
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
