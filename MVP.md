# Beatree MVP Development Plan

**Dynamic Music Discovery - Minimum Viable Product**  
*오디오 피처 기반 분기 추천 시스템 검증을 위한 웹 MVP*

---

## 🎯 MVP 목적

### Primary Goals
1. **개발 환경 세팅** 및 React + Spotify API 익숙해지기
2. **바이브 코딩** 스킬 향상 (1인 개발 역량 강화)
3. **Spotify API** 전체 기능 탐색 및 활용법 습득
4. **Audio Feature 기반 분기 추천**의 실제 효과 검증
5. **분기 세팅 튜닝**을 위한 데이터 수집 및 분석

### Success Criteria
- [ ] Spotify API 모든 기능 정상 작동
- [ ] 3분기 추천이 실제로 다른 느낌의 곡들 제공
- [ ] Audio Feature 튜닝이 추천 결과에 명확한 영향
- [ ] 본인이 30분 이상 연속 사용 가능
- [ ] 만족스러운 분기 패턴 5개 이상 발견

---

## 🔧 MVP 기술 스펙

### Platform & Environment
- **Platform**: PC/Mobile 웹 기반 (반응형)
- **Environment**: 로컬 개발 환경 (localhost:3000)
- **Domain**: 추후 필요시 배포 (Vercel/Netlify)

### Tech Stack
```
Frontend: React 18 + TypeScript
Styling: CSS Modules or Styled Components  
API: Spotify Web API + Audio Features API
Storage: LocalStorage (세션 데이터)
Build: Create React App or Vite
Testing: Manual Testing (MVP 단계)
```

### Core Dependencies
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^4.9.0",
    "axios": "^1.4.0",
    "styled-components": "^6.0.0"
  }
}
```

---

## 🎵 MVP 핵심 기능 정의

### 1. Spotify OAuth & Data Access
- **로그인**: Spotify 계정으로 OAuth 인증
- **플레이리스트**: 사용자의 모든 플레이리스트 불러오기 ✅ *가능*
- **좋아요 목록**: 사용자가 좋아요한 곡 목록 불러오기
- **검색**: Spotify 전체 카탈로그에서 곡 검색

### 2. 시드 곡 선택
```
사용자 선택 옵션:
1. 내 플레이리스트에서 곡 선택
2. 내 좋아요 목록에서 곡 선택  
3. 검색으로 전체 카탈로그에서 곡 선택
```

### 3. 3분기 추천 시스템
**Spotify Recommendations API 활용** ✅ *가능*
```javascript
// 현재 곡 기반 3개 분기 생성
const recommendations = await spotifyApi.getRecommendations({
  seed_tracks: [currentTrackId],
  target_energy: currentEnergy + energyChange,
  target_valence: currentValence + valenceChange,
  target_tempo: currentTempo + tempoChange,
  limit: 3
});
```

### 4. 분기 버튼 UI

#### 일반 사용자 모드
```
🔥 에너지 업    😌 릴렉스    🎵 유사한 곡
```

#### 개발자 모드 (토글 ON)
```
🔥 에너지 업           😌 릴렉스           🎵 유사한 곡
energy: 0.3→0.6       energy: 0.7→0.4      energy: 0.5→0.5
valence: 0.6→0.8      valence: 0.4→0.2     tempo: 120→125
```

**개발자 모드 토글**
- 위치: 우측 상단 "🔧 Dev Mode" 스위치
- ON: Audio Feature 수치 표시
- OFF: 이모지 + 간단한 텍스트만

### 5. Audio Feature 튜닝 시스템

#### Before/After 비교 테이블
```
┌─────────────┬────────┬────────┬────────┐
│ Feature     │ Before │ After  │ Change │
├─────────────┼────────┼────────┼────────┤
│ Energy      │  0.45  │  0.78  │ +0.33  │
│ Valence     │  0.62  │  0.30  │ -0.32  │
│ Tempo       │  128   │  142   │ +14    │
│ Danceability│  0.72  │  0.68  │ -0.04  │
└─────────────┴────────┴────────┴────────┘
```

**실시간 Feature 값 확인**
- 모든 Audio Feature 변화량을 즉시 표시
- 테스트 단계에서 쉽게 수치 조정 가능
- 개발자 모드에서 더 상세한 정보 제공

### 6. 30초 미리듣기 & 상호작용
- **미리듣기**: Spotify Preview URL 활용 (무료)
- **재생 컨트롤**: 재생/일시정지/정지
- **좋아요 추가**: 마음에 드는 곡을 Spotify 좋아요에 추가
- **만족도 평가**: 1-5점 별점으로 추천 품질 평가

### 7. 추천 범위 필터링

#### 좋아요 곡 비율 슬라이더
```
추천 범위 설정:
좋아요 곡 비율: [████████░░] 80%
(80% 좋아요 곡 + 20% 새로운 곡에서 추천)
```

**필터링 옵션**
- 0%: 새로운 곡에서만 추천
- 50%: 좋아요 곡과 새로운 곡 섞어서
- 100%: 좋아요 곡에서만 추천

### 8. 실험 데이터 수집 시스템

#### JSON 데이터 구조
```json
{
  "experiment_sessions": [
    {
      "session_id": "20250622_001",
      "timestamp": "2025-06-22T14:30:00Z",
      "user_id": "spotify_user_123",
      "starting_track": {
        "id": "4iV5W9uYEdYUVa79Ozker4",
        "name": "Flowers",
        "artist": "Miley Cyrus",
        "audio_features": {
          "energy": 0.45,
          "valence": 0.62,
          "tempo": 128,
          "danceability": 0.73
        }
      },
      "branches": [
        {
          "branch_number": 1,
          "button_text": "🔥 에너지 업",
          "feature_changes": {
            "energy": "+0.33",
            "valence": "+0.18",
            "tempo": "+14"
          },
          "recommended_tracks": [
            {
              "id": "track_123",
              "name": "Good 4 U",
              "artist": "Olivia Rodrigo",
              "satisfaction_score": 4,
              "selected": true
            }
          ],
          "user_notes": "정말 신남! 이 조합 좋음"
        }
      ],
      "session_duration": "00:25:30",
      "total_satisfaction": 4.2,
      "liked_songs_ratio": 0.8
    }
  ]
}
```

#### 데이터 저장 & Export
- **실시간 저장**: LocalStorage에 JSON 형태로 저장
- **Export 기능**: "📊 데이터 다운로드" 버튼으로 CSV 변환 후 다운로드
- **사용자 메모**: 각 분기별로 간단한 메모 입력 가능

---

## 📅 MVP 개발 일정 (3주)

### **Week 1: 환경 구축 & API 연동 (5일)**

#### Day 1: 프로젝트 초기 설정
- [ ] React + TypeScript 프로젝트 생성
- [ ] Spotify Developer 계정 생성 및 앱 등록
- [ ] Client ID/Secret 발급 및 `.env.local` 설정
- [ ] 기본 폴더 구조 설계

#### Day 2-3: Spotify OAuth 구현
- [ ] Spotify OAuth 로그인 플로우 구현
- [ ] Access Token 획득 및 관리
- [ ] 사용자 프로필 정보 불러오기 테스트
- [ ] 플레이리스트 목록 API 테스트

#### Day 4-5: 기본 UI 구조
- [ ] 메인 레이아웃 및 네비게이션 구현
- [ ] 플레이리스트 선택 UI 구현
- [ ] 곡 검색 UI 구현
- [ ] **개발자 모드 토글** 구현
- [ ] 기본 스타일링 및 반응형 레이아웃

### **Week 2: 추천 시스템 & Audio Features (5일)**

#### Day 6-7: 추천 API 연동
- [ ] Spotify Recommendations API 연동 및 테스트
- [ ] Audio Features API 연동
- [ ] 3개 분기 추천 로직 구현
- [ ] **이모지 + 텍스트 분기 버튼** UI 구현

#### Day 8-9: Audio Feature 튜닝 시스템
- [ ] Audio Feature 값 실시간 표시 UI
- [ ] **Before/After 테이블** 구현
- [ ] **실시간 Feature 수치 표시** (개발자 모드)
- [ ] Feature 변화량 계산 로직 구현

#### Day 10: 30초 미리듣기 구현
- [ ] Spotify Preview URL 재생 기능
- [ ] 미니 플레이어 UI 및 컨트롤
- [ ] 재생/일시정지/정지 기능
- [ ] **만족도 평가 UI** (별점 또는 1-5 버튼)

### **Week 3: 필터링 & 데이터 수집 (5일)**

#### Day 11-12: 좋아요/플레이리스트 필터링
- [ ] 사용자 좋아요 목록 API 연동
- [ ] **좋아요 비율 슬라이더** 구현
- [ ] 추천 범위 필터링 로직 구현
- [ ] 필터링 옵션 UI/UX 개선

#### Day 13-14: 실험 데이터 수집
- [ ] **JSON 데이터 구조** 설계 및 구현
- [ ] **세션 기록 시스템** 구현
- [ ] **LocalStorage 저장** 로직
- [ ] **CSV Export 기능** 추가
- [ ] **사용자 메모** 입력 기능

#### Day 15: 테스트 & 디버깅
- [ ] 전체 플로우 통합 테스트
- [ ] 크리티컬 버그 수정
- [ ] 사용자 가이드 작성
- [ ] MVP 완료 및 문서화

---

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── auth/
│   │   ├── SpotifyLogin.tsx         # OAuth 로그인
│   │   └── UserProfile.tsx          # 사용자 정보
│   ├── music/
│   │   ├── PlaylistSelector.tsx     # 플레이리스트 선택
│   │   ├── TrackSearch.tsx          # 곡 검색
│   │   ├── TrackPlayer.tsx          # 30초 미리듣기
│   │   └── SatisfactionRating.tsx   # 만족도 평가
│   ├── recommendation/
│   │   ├── BranchButtons.tsx        # 🔥😌🎵 분기 버튼들
│   │   ├── AudioFeatureTable.tsx    # Before/After 테이블
│   │   └── LikedSongsSlider.tsx     # 좋아요 비율 슬라이더
│   ├── dev/
│   │   ├── DevModeToggle.tsx        # 개발자 모드 스위치
│   │   └── DataExport.tsx           # 📊 데이터 다운로드
│   └── layout/
│       ├── Header.tsx               # 상단 네비게이션
│       └── Layout.tsx               # 메인 레이아웃
├── hooks/
│   ├── useSpotifyAuth.ts            # OAuth 관리
│   ├── useAudioFeatures.ts          # Audio Feature 처리
│   └── useDataLogger.ts             # 데이터 로깅
├── utils/
│   ├── spotify.ts                   # Spotify API 헬퍼
│   ├── audioFeatures.ts             # Feature 조작 로직
│   ├── dataLogger.ts                # 실험 데이터 기록
│   └── csvExport.ts                 # CSV 변환 유틸
├── types/
│   ├── spotify.ts                   # Spotify API 타입
│   └── experiment.ts                # 실험 데이터 타입
└── styles/
    ├── globals.css                  # 전역 스타일
    └── components/                  # 컴포넌트별 스타일
```

---

## 🧪 MVP 테스트 계획

### 기능 테스트 체크리스트

#### Spotify API 연동
- [ ] OAuth 로그인 성공
- [ ] 플레이리스트 목록 불러오기
- [ ] 좋아요 목록 불러오기
- [ ] 곡 검색 결과 표시
- [ ] Audio Features 정보 획득

#### 추천 시스템
- [ ] 3분기 추천 생성
- [ ] Audio Feature 기반 분기 차이 확인
- [ ] 좋아요/새곡 필터링 동작
- [ ] 개발자 모드 Feature 수치 표시

#### 사용자 경험
- [ ] 30초 미리듣기 재생
- [ ] 만족도 평가 입력
- [ ] 세션 데이터 저장
- [ ] CSV 데이터 다운로드

### 실험 데이터 수집 목표
```
목표 데이터:
- 세션 수: 50개 이상
- 분기 선택 기록: 150개 이상  
- 만족도 평가: 각 분기별 5점 만점 평균 3.5 이상
- Audio Feature 패턴: 효과적인 조합 5개 이상 발견
```

---

## 📊 MVP 완료 시 산출물

### 1. 작동하는 웹 애플리케이션
- **URL**: `http://localhost:3000`
- **기능**: Spotify 로그인 → 곡 선택 → 3분기 추천 → 미리듣기 → 데이터 수집

### 2. 실험 데이터 및 분석
```
데이터 파일:
- experiment_sessions.json (원본 데이터)
- experiment_data.csv (분석용 CSV)
- satisfaction_analysis.xlsx (만족도 분석)
```

### 3. 개발 문서화
- **API 사용 가이드**: Spotify API 활용법 정리
- **Audio Feature 분석**: 각 Feature 조합별 효과 분석
- **분기 패턴 가이드**: 효과적인 분기 설정 방법
- **다음 단계 로드맵**: 모바일 앱 전환 계획

### 4. 학습 성과 정리
- **기술 스킬**: React + TypeScript + Spotify API
- **제품 스킬**: 사용자 테스트, 데이터 분석, 기능 우선순위
- **개발 프로세스**: 1인 개발 워크플로우, 빠른 프로토타이핑

---

## 🚀 MVP 이후 발전 방향

### Phase 1: 웹 앱 고도화 (MVP + 4주)
- 시각적 트리 네트워크 구현
- 더 많은 분기 패턴 추가
- 사용자 설정 및 프리셋 저장

### Phase 2: 모바일 앱 전환 (8주)
- React Native 프로젝트 전환
- Spotify SDK 연동 (Premium 사용자 전체 재생)
- 네이티브 앱 스토어 배포

### Phase 3: 소셜 기능 (6주)
- 사용자 계정 시스템
- 별자리 공유 기능
- 커뮤니티 피드 구현

---

## ⚠️ MVP 개발 시 주의사항

### Technical Risks
- **Spotify API Rate Limit**: 과도한 요청으로 인한 제한
  - *해결책*: 적절한 캐싱 및 요청 간격 조절
- **Audio Feature 데이터 품질**: 일부 곡의 Feature 정보 부정확
  - *해결책*: 다수의 테스트 곡으로 패턴 검증
- **브라우저 호환성**: 오디오 재생 관련 브라우저 차이
  - *해결책*: Chrome, Safari, Firefox 테스트

### Development Risks  
- **개발 시간 과소평가**: 3주 일정이 타이트할 수 있음
  - *해결책*: 핵심 기능 우선순위 설정, 선택적 기능 제외
- **Spotify API 복잡성**: OAuth 및 토큰 관리 복잡
  - *해결책*: 단계별 구현, 충분한 테스트 시간 확보

### User Experience Risks
- **30초 제한의 아쉬움**: 짧은 미리듣기로 인한 만족도 저하
  - *해결책*: 명확한 Premium 전환 안내 및 가치 제시

---

*Last Updated: 2025.06.22*  
*Version: MVP v1.0*  
*Owner: Tyler Kim (PM & Developer)*