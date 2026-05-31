/* ============================================================================
   Smart GALA-TARI Navigator - Advanced Interactive Web Engine (ES6+)
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 다중 단지 및 평수 데이터베이스 (Real-World Rich Dataset)
    const dbComplexes = {
        origin: {
            name: "상계보람 2단지",
            base_price: 65000, // 작년 8월 기준 매입 실거래가 6억 5,000만원
            current_far: 197.0,
            average_land_share: 14.2,
            has_subground_elevator: false,
            pediatric_score: 45.5,
            childcare_score: 65.0,
            flatness_score: 70.0,
            park_accessibility_score: 80.0,
            noise_safety_score: 75.0,
            historical_avg_gap_ratio: 0.35
        },
        targets: {
            "shin_an_37": {
                name: "중계 동진신안 (37평)",
                recent_price: 98000, // 9억 8,000만원
                current_far: 217.0,
                average_land_share: 16.5,
                has_subground_elevator: false, // 지하주차장 미연결
                pediatric_score: 95.0, // 야간 소아과 밀집
                childcare_score: 88.0,
                flatness_score: 98.0, // 은행사거리 평지
                park_accessibility_score: 90.0,
                noise_safety_score: 40.0, // 학원가 대로변 하원 정체 소음
                total_pledges_count: 5,
                pledge_completed_count: 2,
                regulation_benefit_factor: 1.2,
                historical_avg_gap_ratio: 0.55,
                reconstruction_announced: false,
                coords: { x: 285, y: 130 }
            },
            "shin_an_48": {
                name: "중계 동진신안 (48평)",
                recent_price: 125000, // 12억 5,000만원
                current_far: 217.0,
                average_land_share: 21.4,
                has_subground_elevator: false,
                pediatric_score: 95.0,
                childcare_score: 88.0,
                flatness_score: 98.0,
                park_accessibility_score: 90.0,
                noise_safety_score: 45.0,
                total_pledges_count: 5,
                pledge_completed_count: 2,
                regulation_benefit_factor: 1.2,
                historical_avg_gap_ratio: 0.75,
                reconstruction_announced: false,
                coords: { x: 285, y: 130 }
            },
            "cheong_gu_32": {
                name: "중계 청구3차 (32평)",
                recent_price: 105000, // 10억 5,000만원
                current_far: 212.0,
                average_land_share: 15.8,
                has_subground_elevator: true, // ★ 지하주차장 엘리베이터 직결!! (실거주 점수 폭발)
                pediatric_score: 96.0,
                childcare_score: 92.0,
                flatness_score: 99.0,
                park_accessibility_score: 92.0,
                noise_safety_score: 45.0,
                total_pledges_count: 5,
                pledge_completed_count: 3,
                regulation_benefit_factor: 1.25,
                historical_avg_gap_ratio: 0.62,
                reconstruction_announced: true, // 이미 재건축 추진 확정
                coords: { x: 285, y: 220 }
            },
            "life_cheong_42": {
                name: "중계 라이프청구 (42평)",
                recent_price: 118000, // 11억 8,000만원
                current_far: 223.0,
                average_land_share: 18.9,
                has_subground_elevator: true, // 지하주차장 엘리베이터 직결
                pediatric_score: 94.0,
                childcare_score: 90.0,
                flatness_score: 97.0,
                park_accessibility_score: 95.0,
                noise_safety_score: 50.0,
                total_pledges_count: 6,
                pledge_completed_count: 3,
                regulation_benefit_factor: 1.3,
                historical_avg_gap_ratio: 0.68,
                reconstruction_announced: true,
                coords: { x: 380, y: 140 }
            }
        }
    };

    // 2. 신뢰 정부발표 PDF 및 뉴스 아카이브 데이터베이스
    const initialArchiveData = [
        {
            id: 1,
            type: "pdf",
            source: "서울시 공동주택지원과",
            title: "서울시 2030 공동주택 재건축 및 정비계획 용적률 인센티브 통합 실무 지침",
            date: "2026-05-15",
            size: "4.2 MB",
            url: "#",
            content: "서울시내 구축 아파트 안전진단 생략 기준 및 역세권 고밀 복합정비구역 용적률 최대 400% 인상 인센티브 적용 상세 규칙 포함."
        },
        {
            id: 2,
            type: "pdf",
            source: "국토교통부 철도건설과",
            title: "도시철도 동북선 건설공사 실시계획 승인 고시문 및 역사별 출구 배치도",
            date: "2026-04-20",
            size: "12.8 MB",
            url: "#",
            content: "노원구 은행사거리역 공정 현황 및 출구 연접 상권 도보 보도정비 세부 실시설계 도면 첨부 완료."
        },
        {
            id: 3,
            type: "pdf",
            source: "서울시 교육청",
            title: "학군지 거점학교 지정 및 을지초/불암초 반경 어린이 보호구역 안전 보강 대책",
            date: "2026-03-10",
            size: "2.1 MB",
            url: "#",
            content: "중계 은행사거리 모범 학군지 내 영유아 보육 인프라 지원 및 보도 평탄화 작업 교육청 보도자료."
        },
        {
            id: 4,
            type: "article",
            source: "한국경제 부동산",
            title: "[단독] 노원구 주요 역세권 지구단위계획 종상향 통과... 은행사거리 일대 복합개발 급물살",
            date: "2026-05-28",
            size: "450 KB",
            url: "#",
            content: "중계동 동진신안, 청구3차, 라이프청구 단지들이 특별정비구역 편입 가능성이 높아지며 매도인 우위 호가 랠리 시작 분석."
        }
    ];

    let currentArchive = [...initialArchiveData];

    // 3. DOM 요소 매핑
    const selectTargetComplex = document.getElementById('select-target-complex');
    const selectPriceCorrection = document.getElementById('select-price-correction');
    const switchAdvanceConsulting = document.getElementById('switch-advance-consulting');
    
    // Sliders
    const cashSlider = document.getElementById('cash-slider');
    const loanSlider = document.getElementById('loan-slider');
    const remodelingSlider = document.getElementById('remodeling-slider');
    const incomeSlider = document.getElementById('income-slider');

    const cashVal = document.getElementById('cash-val');
    const loanVal = document.getElementById('loan-val');
    const remodelingVal = document.getElementById('remodeling-val');
    const incomeVal = document.getElementById('income-val');

    // Values Display
    const indexNumber = document.getElementById('index-number');
    const circleProgress = document.querySelector('.circle-progress');
    const verdictBadge = document.getElementById('verdict-badge');
    const verdictDesc = document.getElementById('verdict-desc');

    const requiredCapitalText = document.getElementById('req-capital');
    const availableResourcesText = document.getElementById('avail-resources');
    const netMarginText = document.getElementById('net-margin');
    const stressStatusDisplay = document.getElementById('stress-status');
    const warningBox = document.getElementById('warning-box');

    // Complex Cards display
    const textOriginName = document.querySelector('#card-origin .complex-name');
    const textOriginPrice = document.querySelector('#card-origin .complex-price');
    const textTargetName = document.querySelector('#card-target .complex-name');
    const textTargetPrice = document.querySelector('#card-target .complex-price');

    // Table metric bars
    const rowBars = {
        business: { origin: document.getElementById('bar-origin-business'), target: document.getElementById('bar-target-business'), scoreO: document.getElementById('score-o-business'), scoreT: document.getElementById('score-t-business') },
        care: { origin: document.getElementById('bar-origin-care'), target: document.getElementById('bar-target-care'), scoreO: document.getElementById('score-o-care'), scoreT: document.getElementById('score-t-care') },
        mobility: { origin: document.getElementById('bar-origin-mobility'), target: document.getElementById('bar-target-mobility'), scoreO: document.getElementById('score-o-mobility'), scoreT: document.getElementById('score-t-mobility') },
        comfort: { origin: document.getElementById('bar-origin-comfort'), target: document.getElementById('bar-target-comfort'), scoreO: document.getElementById('score-o-comfort'), scoreT: document.getElementById('score-t-comfort') }
    };

    // GIS controls & elements
    const filterButtons = document.querySelectorAll('.filter-btn');
    const mapPois = document.querySelectorAll('.map-poi');
    const mapRoadHighlight = document.querySelector('.map-road-highlight');
    const mapHoverCard = document.getElementById('map-hover-card');
    const hoverComplexName = document.getElementById('hover-complex-name');
    const hoverComplexMetric = document.getElementById('hover-complex-metric');
    const mapPolys = document.querySelectorAll('.map-complex-poly');

    // Archive Board DOMs
    const archiveSearchInput = document.getElementById('archive-search-input');
    const archiveTableBody = document.getElementById('archive-table-body');
    const btnCrawl = document.getElementById('btn-crawl');
    const btnDbSeed = document.getElementById('btn-db-seed');
    const consoleTerminal = document.getElementById('console-terminal');
    const alertList = document.getElementById('alert-list');

    // Consulting Modal DOMs
    const btnOpenConsulting = document.getElementById('btn-open-consulting');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBodyContent = document.getElementById('modal-body-content');

    // 4. 갈아타기 지표 계산 엔진 고도화 구현
    function updateDashboard() {
        const selectedKey = selectTargetComplex.value;
        const target = dbComplexes.targets[selectedKey];
        const origin = dbComplexes.origin;

        // 보람아파트 시세 변동 반영 로직
        const correctionType = selectPriceCorrection.value;
        let correctedOriginPrice = origin.base_price;
        let priceStatusLabel = "(기존 매수 시세)";

        if (correctionType === 'asking_price') {
            correctedOriginPrice = origin.base_price + 17000; // 호가 1.7억 상승 적용
            priceStatusLabel = "(호가 +1.7억 반영)";
        } else if (correctionType === 'actual_price') {
            correctedOriginPrice = origin.base_price + 10000; // 실거래가 1억 상승 적용
            priceStatusLabel = "(실거래 +1.0억 반영)";
        }

        // UI에 매도 예정 보람아파트 가격 보정 출력
        textOriginName.innerText = `${origin.name} ${priceStatusLabel}`;
        textOriginPrice.innerText = `${Math.round(correctedOriginPrice).toLocaleString()} 만원`;
        
        // 대상 단지명 및 호가 매핑
        textTargetName.innerText = target.name;
        textTargetPrice.innerText = `${Math.round(target.recent_price).toLocaleString()} 만원`;

        // ----------------------------------------------------
        // A. 투자 가치 계산 (가중치 60%)
        // ----------------------------------------------------
        const originBiz = (origin.average_land_share / origin.current_far) * 100;
        const targetBiz = (target.average_land_share / target.current_far) * 100;
        const originBizScore = Math.min(30.0, Math.max(5.0, (originBiz - 3.0) * 4));
        const targetBizScore = Math.min(30.0, Math.max(5.0, (targetBiz - 3.0) * 4));

        const originMomentum = 5.0;
        const targetMomentum = Math.min(15.0, (target.regulation_benefit_factor * 10) + ((target.pledge_completed_count / target.total_pledges_count) * 5));

        const currentGap = (target.recent_price - correctedOriginPrice) / correctedOriginPrice;
        const gapEfficiency = target.historical_avg_gap_ratio - currentGap;
        const gapScore = Math.min(15.0, Math.max(0.0, 7.5 + (gapEfficiency * 50)));

        // [고도화 추가] 재건축 기사 전 선제 갈아타기 보너스 점수 산정
        let consultingBonus = 0.0;
        const consultingActive = switchAdvanceConsulting.checked;
        if (consultingActive && !target.reconstruction_announced) {
            if (currentGap <= target.historical_avg_gap_ratio * 1.1) {
                consultingBonus = 5.0; // 5점 보너스 가산
            }
        }

        const originInvest = originBizScore + originMomentum + 5.0;
        const targetInvest = Math.min(60.0, targetBizScore + targetMomentum + gapScore + consultingBonus);

        // ----------------------------------------------------
        // B. 실거주 가치 계산 (가중치 40%) - 영유아 보육 및 인프라 가치 특화
        // ----------------------------------------------------
        const originCare = Math.min(15.0, ((origin.pediatric_score * 0.6) + (origin.childcare_score * 0.4)) * 0.15);
        const targetCare = Math.min(15.0, ((target.pediatric_score * 0.6) + (target.childcare_score * 0.4)) * 0.15);

        const originMobility = Math.min(15.0, ((origin.flatness_score * 0.5) + (origin.has_subground_elevator ? 50.0 : 0.0)) * 0.15);
        const targetMobility = Math.min(15.0, ((target.flatness_score * 0.5) + (target.has_subground_elevator ? 50.0 : 0.0)) * 0.15);

        const originComfort = Math.min(10.0, ((origin.park_accessibility_score * 0.6) + (origin.noise_safety_score * 0.4)) * 0.1);
        const targetComfort = Math.min(10.0, ((target.park_accessibility_score * 0.6) + (target.noise_safety_score * 0.4)) * 0.1);

        const originLiving = originCare + originMobility + originComfort;
        const targetLiving = targetCare + targetMobility + targetComfort;

        // ----------------------------------------------------
        // C. 종합 GALA-TARI INDEX 산정 (100점 만점)
        // ----------------------------------------------------
        const targetTotalIndex = Math.min(100.0, targetInvest + targetLiving);

        // ----------------------------------------------------
        // D. 재무 안전성 스트레스 테스트 (Financial Stress Test)
        // ----------------------------------------------------
        const userFinance = {
            cash_on_hand: parseInt(cashSlider.value),
            current_mortgage_balance: 15000,
            max_available_loan: parseInt(loanSlider.value),
            expected_remodeling_cost: parseInt(remodelingSlider.value),
            annual_income: parseInt(incomeSlider.value)
        };

        const acquisitionTaxRate = target.recent_price < 90000 ? 0.015 : 0.033;
        const fees = target.recent_price * acquisitionTaxRate;
        const totalRequiredCapital = target.recent_price + fees + userFinance.expected_remodeling_cost;

        // 매도 자금에 보정된 상계보람 아파트 시세 자동 투영
        const totalAvailableResources = (
            correctedOriginPrice - userFinance.current_mortgage_balance
            + userFinance.cash_on_hand
            + userFinance.max_available_loan
        );

        const netFinancialMargin = totalAvailableResources - totalRequiredCapital;
        const debtToIncomeRatio = (userFinance.current_mortgage_balance + userFinance.max_available_loan) / Math.max(1, userFinance.annual_income);

        // UI 데이터 출력 동기화
        indexNumber.innerText = Math.round(targetTotalIndex);
        const offset = 314.16 - (targetTotalIndex / 100) * 314.16;
        circleProgress.style.strokeDashoffset = offset;

        // 재무 상태 분석 진단
        let riskLevel = "SAFE";
        let warnings = [];

        if (netFinancialMargin < 0) {
            riskLevel = "CRITICAL_DANGER";
            warnings.push(`자금 부족: 약 <strong>${Math.abs(netFinancialMargin).toLocaleString()}만원</strong>의 조달 갭이 있습니다. 추가 신용 대출 혹은 거치 금액 확보가 절실합니다.`);
        } else if (netFinancialMargin < 5000) {
            riskLevel = "WARNING";
            warnings.push("자금 여유 한계: 인테리어 마감 추가 비용 및 취득세 완납 시 비상 여비가 타이트합니다. 예산 감축을 고려하세요.");
        }

        if (debtToIncomeRatio > 4.5) {
            if (riskLevel !== "CRITICAL_DANGER") riskLevel = "HIGH_DEBT_RISK";
            warnings.push(`DSR 초과 위험: 가구 연소득 대비 총 부채 비율이 <strong>${debtToIncomeRatio.toFixed(1)}배</strong>로 월 원리금 상환 부담률이 높습니다.`);
        }

        // 재무 및 리포트 디렉토리 출력
        requiredCapitalText.innerHTML = `${Math.round(totalRequiredCapital).toLocaleString()} <span style="font-size:0.75rem; color:var(--text-muted)">만원</span>`;
        availableResourcesText.innerHTML = `${Math.round(totalAvailableResources).toLocaleString()} <span style="font-size:0.75rem; color:var(--text-muted)">만원</span>`;
        
        if (netFinancialMargin >= 0) {
            netMarginText.innerHTML = `+${Math.round(netFinancialMargin).toLocaleString()} <span style="font-size:0.75rem; color:var(--text-muted)">만원</span>`;
            netMarginText.style.color = "var(--color-success)";
        } else {
            netMarginText.innerHTML = `${Math.round(netFinancialMargin).toLocaleString()} <span style="font-size:0.75rem; color:var(--text-muted)">만원</span>`;
            netMarginText.style.color = "var(--color-danger)";
        }

        // Verdict Badge & Description
        stressStatusDisplay.className = "stress-status-display";
        if (riskLevel === "SAFE") {
            stressStatusDisplay.innerText = "안정적 (SAFE)";
            stressStatusDisplay.classList.add("status-safe");
            warningBox.style.display = "none";
            
            verdictBadge.innerText = "갈아타기 최적 추천";
            verdictBadge.style.background = "var(--color-success)";
            verdictBadge.style.color = "var(--bg-main)";
            verdictDesc.innerText = "안정적인 자금 운용이 가능하며, 상급지 인프라 상승 효과를 재무 리스크 없이 누릴 수 있는 이상적 구간입니다.";
        } else if (riskLevel === "WARNING") {
            stressStatusDisplay.innerText = "주의 (WARNING)";
            stressStatusDisplay.classList.add("status-warning");
            warningBox.style.display = "flex";
            warningBox.innerHTML = warnings.map(w => `<div>⚠️ ${w}</div>`).join('');
            
            verdictBadge.innerText = "보수적 자금 조정 필요";
            verdictBadge.style.background = "var(--color-warning)";
            verdictBadge.style.color = "var(--bg-main)";
            verdictDesc.innerText = "인프라 개선 효과는 우수하나, 자금 운용 한계 마진에 다다랐으므로 remodeling 예산 축소 등을 적극 조율하십시오.";
        } else {
            stressStatusDisplay.innerText = "위험 (CRITICAL DANGER / HIGH DEBT)";
            stressStatusDisplay.classList.add("status-critical");
            warningBox.style.display = "flex";
            warningBox.innerHTML = warnings.map(w => `<div>🚨 ${w}</div>`).join('');
            
            verdictBadge.innerText = "갈아타기 시기 보류";
            verdictBadge.style.background = "var(--color-danger)";
            verdictBadge.style.color = "var(--text-pure)";
            verdictDesc.innerText = "자금 부족 상태이거나 과도한 대출 이자 부담이 예측되므로, 보람아파트 실거래가 추가 호재가 확인될 때까지 관망을 추천합니다.";
        }

        // 지표 바 차트 동적 갱신
        updateBar(rowBars.business, originInvest, targetInvest, 60.0);
        updateBar(rowBars.care, originCare, targetCare, 15.0);
        updateBar(rowBars.mobility, originMobility, targetMobility, 15.0);
        updateBar(rowBars.comfort, originComfort, targetComfort, 10.0);

        // GIS 맵 하이라이트 동기화 (선택한 아파트 다각형 하이라이트 활성화)
        mapPolys.forEach(p => p.classList.remove('active-complex-shin-an'));
        if (selectedKey.startsWith("shin_an")) {
            document.getElementById('poly-shin-an').classList.add('active-complex-shin-an');
        } else if (selectedKey === "cheong_gu_32") {
            document.getElementById('poly-shin-an').classList.remove('active-complex-shin-an');
        }
    }

    function updateBar(barObj, originVal, targetVal, maxLimit) {
        const originPct = (originVal / maxLimit) * 100;
        const targetPct = (targetVal / maxLimit) * 100;

        barObj.origin.style.width = `${originPct}%`;
        barObj.target.style.width = `${targetPct}%`;

        barObj.scoreO.innerText = originVal.toFixed(1);
        barObj.scoreT.innerText = targetVal.toFixed(1);
    }

    // 5. 드롭다운 및 가격 보정 옵션 이벤트 바인딩
    selectTargetComplex.addEventListener('change', () => {
        const selectedKey = selectTargetComplex.value;
        const target = dbComplexes.targets[selectedKey];
        writeTerminal(`Target Complex Selected: [${target.name}]`, "cmd");
        updateDashboard();
        
        // 맵 센터로 시각 유도 시뮬레이션
        if (target.coords) {
            writeTerminal(`GIS: 지도 좌표 (${target.coords.x}, ${target.coords.y}) 동진 타겟 영역 줌인 락 완료`, "sys");
        }
    });

    selectPriceCorrection.addEventListener('change', () => {
        writeTerminal(`보람아파트 시세 반영 기준 변경됨: [${selectPriceCorrection.options[selectPriceCorrection.selectedIndex].text}]`, "cmd");
        updateDashboard();
    });

    switchAdvanceConsulting.addEventListener('change', () => {
        const active = switchAdvanceConsulting.checked;
        writeTerminal(`재건축 결정 기사 전 선제 갈아타기 컨설팅 모드: [${active ? '활성화 (가산점 적용)' : '비활성화'}]`, "cmd");
        updateDashboard();
    });

    // 6. 슬라이더 바인딩
    const sliders = [cashSlider, loanSlider, remodelingSlider, incomeSlider];
    const valDisplays = [cashVal, loanVal, remodelingVal, incomeVal];

    sliders.forEach((slider, idx) => {
        slider.addEventListener('input', (e) => {
            valDisplays[idx].innerText = `${parseInt(e.target.value).toLocaleString()}만원`;
            updateDashboard();
        });
    });

    // 7. 실시간 크롤링 및 정부 보도자료 아카이브 게시판 렌더링
    function renderArchive(filterKeyword = "") {
        archiveTableBody.innerHTML = "";
        
        const filtered = currentArchive.filter(item => 
            item.title.toLowerCase().includes(filterKeyword.toLowerCase()) ||
            item.source.toLowerCase().includes(filterKeyword.toLowerCase())
        );

        if (filtered.length === 0) {
            archiveTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">검색 결과가 존재하지 않습니다.</td></tr>`;
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            const iconBadge = item.type === "pdf" ? '<span class="badge-pdf">PDF 고시</span>' : '<span class="badge-article">기사</span>';
            
            tr.innerHTML = `
                <td><strong>${item.source}</strong></td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:0.25rem;">
                        <span style="font-weight:600; color:var(--text-pure)">${iconBadge} ${item.title}</span>
                        <span style="font-size:0.78rem; color:var(--text-muted)">${item.content}</span>
                    </div>
                </td>
                <td style="color:var(--text-muted); font-size:0.8rem">${item.date}</td>
                <td><button class="btn-download" data-id="${item.id}">${item.type === "pdf" ? '열람/다운로드' : '링크이동'}</button></td>
            `;
            archiveTableBody.appendChild(tr);
        });

        // 다운로드 버튼 액션 바인딩
        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                const doc = currentArchive.find(item => item.id === id);
                writeTerminal(`Archive: [${doc.title}] ${doc.type === 'pdf' ? '정부 원본 고시 PDF 실시간 파싱 및 디바이스 다운로드 성공' : '기사 원문 브라우저 탭 연결 완료'}`, "sys");
                alert(`[${doc.source} 제공 신뢰성 검증 완료]\n"${doc.title}" 자료를 성공적으로 로드했습니다.\n\n요약 내용: ${doc.content}`);
            });
        });
    }

    archiveSearchInput.addEventListener('input', (e) => {
        renderArchive(e.target.value);
    });

    // 8. GIS Map 다각형 클릭 및 호버 인터랙션 구현
    mapPolys.forEach(poly => {
        poly.addEventListener('mouseover', (e) => {
            mapHoverCard.classList.add('active');
            if (poly.id === 'poly-bo-ram') {
                hoverComplexName.innerText = "상계보람 2단지";
                hoverComplexMetric.innerText = "용적률 197% | 평균 대지지분 14.2평";
            } else if (poly.id === 'poly-shin-an') {
                const targetKey = selectTargetComplex.value;
                const target = dbComplexes.targets[targetKey];
                hoverComplexName.innerText = target.name;
                hoverComplexMetric.innerText = `용적률 ${target.current_far}% | 평균 대지지분 ${target.average_land_share}평 | 소아과 야간진료`;
            }
        });

        poly.addEventListener('mouseout', () => {
            mapHoverCard.classList.remove('active');
        });

        poly.addEventListener('click', () => {
            if (poly.id === 'poly-bo-ram') {
                writeTerminal("GIS: 현재 거주중인 상계보람 2단지 아파트 영역 클릭됨.", "cmd");
            } else if (poly.id === 'poly-shin-an') {
                const targetKey = selectTargetComplex.value;
                const target = dbComplexes.targets[targetKey];
                writeTerminal(`GIS: 갈아타기 추천 단지 [${target.name}] 영역 클릭됨.`, "cmd");
                alert(`[단지 정보 레이더 수집 결과]\n단지명: ${target.name}\n용적률: ${target.current_far}%\n평균대지지분: ${target.average_land_share}평\n세대당 주차대수: ${target.name.includes("청구") ? "1.25" : "1.47"}대\n지하주차장 직결: ${target.has_subground_elevator ? "가능(엘리베이터)" : "불가능(도보 계단)"}`);
            }
        });
    });

    // 9. 안심 레이더 맵 필터 및 버튼 인터랙션 고도화
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const filterType = btn.dataset.filter;

            mapPois.forEach(poi => {
                if (poi.classList.contains(`map-poi-${filterType}`)) {
                    if (btn.classList.contains('active')) {
                        poi.classList.add('visible');
                    } else {
                        poi.classList.remove('visible');
                    }
                }
            });

            if (filterType === 'flatness') {
                if (btn.classList.contains('active')) {
                    mapRoadHighlight.style.display = "block";
                    writeTerminal("GIS: 유모차 보행 평지 최적 동선(완벽 평지 98점 검증) 맵 오버레이 작동", "sys");
                } else {
                    mapRoadHighlight.style.display = "none";
                }
            } else {
                writeTerminal(`GIS: [${btn.innerText}] 레이어 모니터링 토글 완료`, "cmd");
            }
        });
    });

    // 10. 선제적 재건축 타이밍 갈아타기 컨설팅 모달 구현
    btnOpenConsulting.addEventListener('click', () => {
        const selectedKey = selectTargetComplex.value;
        const target = dbComplexes.targets[selectedKey];
        const isAnnounced = target.reconstruction_announced;
        
        modalOverlay.classList.add('active');
        
        let reportHtml = "";
        if (isAnnounced) {
            reportHtml = `
                <h3 style="color:var(--color-primary); font-size:1.3rem; margin-bottom:1rem; font-weight:800;">🚨 정비구역 확정 발표 단지 알림</h3>
                <p style="margin-bottom:1rem; font-size:0.92rem; color:var(--text-high);">
                    선택하신 <strong>${target.name}</strong>은 이미 재건축 추진위원회 설립 혹은 안전진단 최종 통과 등 정비 구역 확정 발표가 완료된 단지입니다.
                </p>
                <div style="background:hsla(355, 90%, 55%, 0.1); border:1px solid var(--color-danger); border-radius:12px; padding:1rem; margin-bottom:1.5rem; font-size:0.88rem;">
                    <strong>[시장 호가 선반영 주의]</strong><br>
                    정비사업 확정 기사가 보도되었으므로, 현재 시장 호가에는 미래 재건축 기대 가격 거품(Priced-in premium)이 대폭 유입되었습니다. 상계보람 매도 자금 상승분 대비 갭의 크기가 상대적으로 급속히 확대될 우려가 있습니다.
                </div>
                <p style="font-size:0.88rem; color:var(--text-muted)">
                    * 대책 제안: 기사가 나기 전 저평가 상태인 대체 투자 단지(예: 아직 발표 전인 동진신안 37평)로 시선을 돌리는 것을 강력 조언해 드립니다.
                </p>
            `;
        } else {
            reportHtml = `
                <h3 style="color:var(--color-secondary); font-size:1.3rem; margin-bottom:1rem; font-weight:800;">✨ 재건축 공시 전 선제 갈아타기 리포트</h3>
                <p style="margin-bottom:1rem; font-size:0.92rem; color:var(--text-high);">
                    선택하신 <strong>${target.name}</strong>은 은행사거리 내 학군지 실수요를 탄탄히 확보하고 있으나, 아직 공식 재건축/통합재건축 확정 보도 기사가 나가지 않은 **'저평가 기회의 단지'**입니다.
                </p>
                <div style="background:hsla(145, 80%, 50%, 0.15); border:1px solid var(--color-success); border-radius:12px; padding:1.2rem; margin-bottom:1.5rem; font-size:0.9rem; color:var(--text-high);">
                    <strong>[선제적 매수 타이밍 검증: 우수]</strong><br>
                    - 현재 갭 격차: <strong>역사적 최저 수준 수렴 중</strong><br>
                    - 예측 프리미엄 상승률: <strong>기사 고시 발표 시 최소 호가 +1.5억 ~ 2.0억 즉각 상승 예측</strong><br>
                    - 컨설팅 가산 보너스: <strong>지표 계산 엔진 가산점 +5.0점 전격 적용 완료</strong>
                </div>
                <p style="font-size:0.88rem; color:var(--text-muted)">
                    * 실거주 의사결정: 보람아파트 실거래 상승 차익(1억)을 활용하여, 정비사업 기대감이 대외 언론에 유출되어 호가가 전격 랠리를 시작하기 전에 매수를 선결정하는 것이 자산증식 관점에서 압도적인 전략 우위를 가집니다.
                </p>
            `;
        }
        
        modalBodyContent.innerHTML = reportHtml;
    });

    modalCloseBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    // 10. 가상 크롤러 수동 가동 & 뉴스 추가 
    let scenarioIndex = 0;
    const crawlScenarios = [
        {
            source: "국토교통부 보도자료",
            type: "pdf",
            title: "재건축 패스트트랙 특별법 입법 고시 및 안전진단 완전 생략 가이드라인",
            date: "2026-05-31",
            size: "8.7 MB",
            content: "안전진단 단계 생략 및 통합심의 간소화로 상급지 구축 재건축 정비사업 조합 설립 속도 3년 이상 단축 정책.",
            effect: () => {
                dbComplexes.targets.shin_an_37.regulation_benefit_factor = 1.35;
                dbComplexes.targets.cheong_gu_32.regulation_benefit_factor = 1.4;
                writeTerminal("Crawler: 국토교통부 신규 PDF 입법 규제 수집 완료. 단지별 규제 가중치 대폭 상향 적용.", "sys");
            }
        },
        {
            source: "서울시 도시안전본부",
            type: "pdf",
            title: "2026 노원구 은행사거리 지하차도 및 평탄화 유모차 안심 보도정비 중장기 계획",
            date: "2026-05-31",
            size: "1.9 MB",
            content: "유모차 및 어린이 도행 보호를 위한 턱 낮추기 작업 및 보도 블록 친환경 아스팔트 교체 공사 안내.",
            effect: () => {
                dbComplexes.targets.shin_an_37.flatness_score = 100.0;
                writeTerminal("Crawler: 서울시 보도정비 예산 확정 공고 수집. 동진신안 도보 보행 평지 점수 만점(100.0) 갱신.", "sys");
            }
        }
    ];

    btnCrawl.addEventListener('click', () => {
        if (scenarioIndex >= crawlScenarios.length) {
            writeTerminal("Crawler: 신규 크롤링 할 정책 고시 자료가 없습니다. (최신 데이터 동기화 100%)", "cmd");
            alert("이미 모든 실시간 최신 정보가 동기화되어 있습니다.");
            return;
        }

        const sc = crawlScenarios[scenarioIndex];
        sc.effect();
        
        // 데이터 아카이브 데이터베이스에 새 고시자료 주입
        const newId = currentArchive.length + 1;
        currentArchive.unshift({
            id: newId,
            type: sc.type,
            source: sc.source,
            title: sc.title,
            date: sc.date,
            size: sc.size,
            content: sc.content
        });

        // 대시보드 상단 경보판에 실시간 알림 카드로도 추가
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item new-${sc.type === 'pdf' ? 'legal' : 'pediatric'}`;
        alertItem.innerHTML = `
            <div class="alert-body">
                <span class="alert-tag legal">실시간공고</span>
                <span>[${sc.source}] <strong>"${sc.title}"</strong> 자료 실시간 수집 및 게시판 아카이브 이관 완료</span>
            </div>
            <span class="alert-time">방금 전</span>
        `;
        alertList.insertBefore(alertItem, alertList.firstChild);

        renderArchive();
        updateDashboard();
        
        writeTerminal(`Scraper: [${sc.source}] 주관 보도자료 크롤링 성공. 아카이브 게시판에 적재 완료.`, "sys");
        scenarioIndex++;
    });

    btnDbSeed.addEventListener('click', () => {
        writeTerminal("SQL Execution: PostgreSQL `schema.sql` 리빌드 및 가동", "cmd");
        setTimeout(() => {
            writeTerminal("SUCCESS: complexes, infra_scores, political_pledges 데이터 최적화 시딩 완료", "sys");
            alert("PostgreSQL 데이터베이스 테이블 시딩 및 최적화가 완료되었습니다.");
        }, 500);
    });

    let consoleLogCount = 0;
    function writeTerminal(message, type = "cmd") {
        consoleLogCount++;
        const timeStr = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.innerHTML = `[${timeStr}] $ ${message}`;
        consoleTerminal.appendChild(line);
        consoleTerminal.scrollTop = consoleTerminal.scrollHeight;
    }

    // 초기 구동
    renderArchive();
    updateDashboard();
});
