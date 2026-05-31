# -*- coding: utf-8 -*-
"""
Smart GALA-TARI Navigator - 갈아타기 종합 점수 (Gala-Tari Index) 고도화 연산 엔진
- 다중 단지(동진신안 37평/48평, 청구3차 32평, 라이프청구 42평) 지원
- 기존 단지(상계보람 2단지) 매입 후 시세 상승 보정 파라미터 적용
- 재건축 고시 발표 전 선제 갈아타기 타이밍 컨설팅 가산점 알고리즘 추가
"""

import sys
from typing import Dict, Any, List

def calculate_gala_tari_index(
    origin_complex: Dict[str, Any],
    target_complex: Dict[str, Any],
    user_finance: Dict[str, Any],
    advance_consulting_active: bool = False
) -> Dict[str, Any]:
    """
    상급지 갈아타기 매력도 점수 (Gala-Tari Index) 및 재무적 안정성을 검증하는 알고리즘
    
    :param origin_complex: 현재 거주 단지 정보 및 인프라 점수 객체
    :param target_complex: 갈아타기 목표 단지 정보 및 인프라 점수 객체
    :param user_finance: 유저 재무 정보 (보유현금, 부채 한도, 기존 매도 예상가, 예상 인테리어비 등)
    :param advance_consulting_active: 재건축 공시 전 선제적 갈아타기 컨설팅 가산 여부
    :return: 갈아타기 가치 점수 및 재무 위험 진단 리포트
    """
    
    # ----------------------------------------------------
    # PHASE 1. 기존 주택(상계보람) 시세 보정 로직
    # ----------------------------------------------------
    # 작년 8월 매입 이후 호가 +1.7억, 실거래 +1.0억 상승 팩트 반영
    origin_base_price = origin_complex['recent_price']
    
    if user_finance.get('price_correction_type') == 'asking_price':
        corrected_origin_price = origin_base_price + 17000  # 호가 기준 1.7억 상승 보정
    elif user_finance.get('price_correction_type') == 'actual_price':
        corrected_origin_price = origin_base_price + 10000  # 실거래 기준 1억 상승 보정
    else:
        corrected_origin_price = origin_base_price          # 미보정
        
    # ----------------------------------------------------
    # PHASE 2. 투자 가치 계산 (가중치 60%)
    # ----------------------------------------------------
    
    # 1. 정비사업 사업성 (최대 30점)
    # 기존 용적률이 낮고, 평균 대지지분이 넓을수록 가산점 부여
    far_ratio = target_complex['current_far']
    land_share = target_complex['average_land_share']
    
    reconstruction_potential = (land_share / far_ratio) * 100
    biz_score = min(30.0, max(5.0, (reconstruction_potential - 3.0) * 4))
    
    # 2. 미래 모멘텀 & 호재 지표 (최대 15점)
    total_pledges = max(1, target_complex.get('total_pledges_count', 1))
    pledge_progress_rate = target_complex.get('pledge_completed_count', 0) / total_pledges
    momentum_score = min(15.0, (target_complex.get('regulation_benefit_factor', 1.0) * 10) + (pledge_progress_rate * 5))
    
    # 3. 갭 메우기 타이밍 지표 (최대 15점)
    historical_avg_gap = target_complex.get('historical_avg_gap_ratio', 0.35)
    current_gap = (target_complex['recent_price'] - corrected_origin_price) / corrected_origin_price
    
    gap_efficiency = historical_avg_gap - current_gap
    gap_score = min(15.0, max(0.0, 7.5 + (gap_efficiency * 50)))
    
    # [고도화 추가] 선제적 갈아타기 컨설팅 모드 가산점 (최대 5점 보너스)
    # 대상 단지가 아직 재건축 호재 기사가 발표되기 전이고, 갭이 매력적일 때 선제 매수를 유도하는 점수 보정
    consulting_bonus = 0.0
    if advance_consulting_active and not target_complex.get('reconstruction_announced', False):
        if current_gap <= historical_avg_gap * 1.1: # 갭 격차가 역사적 평균 수준 이내일 때
            consulting_bonus = 5.0
            
    investment_score = min(60.0, biz_score + momentum_score + gap_score + consulting_bonus)

    # ----------------------------------------------------
    # PHASE 3. 실거주 가치 계산 (가중치 40%) - 25개월아 영유아 특화 가산점
    # ----------------------------------------------------
    
    # 1. 보육 및 의료 편의성 (최대 15점)
    care_score = (target_complex['pediatric_score'] * 0.6) + (target_complex['childcare_score'] * 0.4)
    care_score = min(15.0, care_score * 0.15)
    
    # 2. 평지 및 유모차 이동성 (최대 15점)
    flatness = target_complex['flatness_score'] * 0.5
    elevator_direct = 50.0 if target_complex['has_subground_elevator'] else 0.0
    mobility_score = min(15.0, (flatness + elevator_direct) * 0.15)
    
    # 3. 쾌적성 및 소음 스트레스 역산 (최대 10점)
    noise_safety = (target_complex['park_accessibility_score'] * 0.6) + (target_complex['noise_safety_score'] * 0.4)
    living_comfort_score = min(10.0, noise_safety * 0.1)
    
    living_score = care_score + mobility_score + living_comfort_score

    # ----------------------------------------------------
    # PHASE 4. 종합 Gala-Tari Index 산출 (100점 만점)
    # ----------------------------------------------------
    gala_tari_index = investment_score + living_score

    # ----------------------------------------------------
    # PHASE 5. 재무 안전 마지노선 필터 (Financial Stress Test)
    # ----------------------------------------------------
    acquisition_tax_rate = 0.015 if target_complex['recent_price'] < 90000 else 0.033
    fees = target_complex['recent_price'] * acquisition_tax_rate
    
    total_required_capital = target_complex['recent_price'] + fees + user_finance['expected_remodeling_cost']
    
    # 조달 자산에 보정된 상계보람 매도 예정가격 적용
    total_available_resources = (
        corrected_origin_price - user_finance['current_mortgage_balance']
        + user_finance['cash_on_hand']
        + user_finance['max_available_loan']
    )
    net_financial_margin = total_available_resources - total_required_capital
    debt_to_income_ratio = (user_finance['current_mortgage_balance'] + user_finance['max_available_loan']) / max(1, user_finance['annual_income'])
    
    risk_level = "SAFE"
    warnings = []
    
    is_safe = net_financial_margin >= 0
    if not is_safe:
        risk_level = "CRITICAL_DANGER"
        warnings.append(f"자금 부족: 약 {abs(net_financial_margin):,}만원의 자금 갭이 존재합니다.")
    elif net_financial_margin < 5000:
        risk_level = "WARNING"
        warnings.append("재무 여유 한계: 돌발 추가 인테리어 비용 및 세금 납부 시 비상 예비비가 타이트합니다.")
        
    if debt_to_income_ratio > 4.5:
        risk_level = "HIGH_DEBT_RISK"
        warnings.append("소득 대비 부채 비중(DSR 프록시)이 4.5배를 초과하여 대출 상환 압박이 큽니다.")

    return {
        "corrected_origin_price": corrected_origin_price,
        "gala_tari_index": round(gala_tari_index, 2),
        "investment_value_breakdown": {
            "business_score": round(biz_score, 2),
            "momentum_score": round(momentum_score, 2),
            "gap_score": round(gap_score, 2),
            "consulting_bonus": round(consulting_bonus, 2)
        },
        "living_value_breakdown": {
            "care_score": round(care_score, 2),
            "mobility_score": round(mobility_score, 2),
            "comfort_score": round(living_comfort_score, 2)
        },
        "financial_analysis": {
            "required_capital": int(total_required_capital),
            "available_resources": int(total_available_resources),
            "net_margin": int(net_financial_margin),
            "risk_level": risk_level,
            "warnings": warnings
        }
    }

if __name__ == "__main__":
    # 다중 단지 및 상승 보정 엔진 시뮬레이션 테스트
    print("= Smart GALA-TARI Navigator 고도화 알고리즘 구동 =")
    
    # 1. 기존 단지 (상계보람 2단지 28평 - 작년 8월 매매 후 호가 +1.7억, 실거래 +1억 상승 적용)
    origin = {
        "name": "상계보람 2단지 (28평)",
        "recent_price": 65000,
        "current_far": 197.0,
        "average_land_share": 14.2,
        "has_subground_elevator": False,
        "pediatric_score": 45.5,
        "childcare_score": 65.0,
        "flatness_score": 70.0,
        "park_accessibility_score": 80.0,
        "noise_safety_score": 75.0
    }
    
    # 2. 다중 목표 단지 후보군 정의
    target_options = {
        "shin_an_37": {
            "name": "중계 동진신안 (37평)",
            "recent_price": 98000,
            "current_far": 217.0,
            "average_land_share": 16.5,
            "has_subground_elevator": False, # 지하 주차장 직결 미연결 (구축 한계)
            "pediatric_score": 95.0,
            "childcare_score": 88.0,
            "flatness_score": 98.0,
            "park_accessibility_score": 90.0,
            "noise_safety_score": 40.0,
            "total_pledges_count": 5,
            "pledge_completed_count": 2,
            "regulation_benefit_factor": 1.2,
            "historical_avg_gap_ratio": 0.55,
            "reconstruction_announced": False  # 아직 재건축 공식 미발표
        },
        "cheong_gu_32": {
            "name": "중계 청구3차 (32평)",
            "recent_price": 105000,
            "current_far": 212.0,
            "average_land_share": 15.8,
            "has_subground_elevator": True,  # ★ 지하주차장 엘리베이터 직결!! (실거주 압도적 메리트)
            "pediatric_score": 96.0,
            "childcare_score": 92.0,
            "flatness_score": 99.0,
            "park_accessibility_score": 92.0,
            "noise_safety_score": 45.0,
            "total_pledges_count": 5,
            "pledge_completed_count": 3,
            "regulation_benefit_factor": 1.25,
            "historical_avg_gap_ratio": 0.65,
            "reconstruction_announced": True   # 이미 재건축 발표됨 (호가 선반영)
        }
    }
    
    # 3. 유저 재무 설정 - 실거래가 +1억 상승 적용 시나리오
    finance = {
        "cash_on_hand": 20000,
        "current_mortgage_balance": 15000,
        "max_available_loan": 40000,
        "expected_remodeling_cost": 6500,
        "annual_income": 9500,
        "price_correction_type": "actual_price"  # 실거래가 기준 +1억 자동 가산 보정 활성화
    }
    
    # 동진신안 37평 선제 컨설팅 비활성화 vs 활성화 비교
    res_normal = calculate_gala_tari_index(origin, target_options["shin_an_37"], finance, advance_consulting_active=False)
    res_consulting = calculate_gala_tari_index(origin, target_options["shin_an_37"], finance, advance_consulting_active=True)
    
    # 청구 3차 32평 (지하주차장 직결 메리트 단지)
    res_cheong_gu = calculate_gala_tari_index(origin, target_options["cheong_gu_32"], finance, advance_consulting_active=False)

    print(f"\n[시나리오 A] 보람아파트 실거래 +1억 반영 후, 중계 동진신안 37평 갈아타기")
    print(f"  - 보람아파트 보정 매도액: {res_normal['corrected_origin_price']:,}만원 (실거래가 보정 반영 완료)")
    print(f"  - 일반 갈아타기 지표 점수: {res_normal['gala_tari_index']}점")
    print(f"  - 선제 매수 컨설팅 가산 시 지표 점수: {res_consulting['gala_tari_index']}점 (보너스 가산점 +{res_consulting['investment_value_breakdown']['consulting_bonus']}점 적용됨)")
    print(f"  - 조달 여유 마진: {res_normal['financial_analysis']['net_margin']:,}만원 (안정성: {res_normal['financial_analysis']['risk_level']})")
    
    print(f"\n[시나리오 B] 지하주차장 엘리베이터 직결 단지 - 중계 청구3차 32평 갈아타기")
    print(f"  - 갈아타기 지표 점수: {res_cheong_gu['gala_tari_index']}점")
    print(f"  - 유모차 보행성 점수: {res_cheong_gu['living_value_breakdown']['mobility_score']:.2f}점 / 15.00점 (지하 직결로 인한 실거주 편의 대폭 상승)")
    print(f"  - 조달 여유 마진: {res_cheong_gu['financial_analysis']['net_margin']:,}만원 (고가 단지 진입으로 예산 압박: {res_cheong_gu['financial_analysis']['risk_level']})")
    if res_cheong_gu['financial_analysis']['warnings']:
        print("    * WARNINGS:")
        for w in res_cheong_gu['financial_analysis']['warnings']:
            print(f"      - {w}")
