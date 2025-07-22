# 🎵 Beatree MVP
**Premium 없이도 작동하는 음악 탐험 트리 웹앱**

Spotify의 방대한 음악 데이터와 Audio Features를 활용하여, 마치 별자리를 그리듯 음악을 탐험하는 새로운 경험을 제공합니다.

![Beatree Demo](https://via.placeholder.com/800x400/1a1a2e/16213e?text=🎵+Beatree+MVP+Demo)

## ✨ 주요 기능

### 🎯 **Premium 없는 추천 시스템**
- Spotify Premium 계정 없이도 모든 기능 이용 가능
- 사용자의 플레이리스트와 좋아요 목록을 활용한 똑똑한 추천
- 하이브리드 추천 엔진 (라이브러리 + 검색 + 관련 아티스트)

### 🌟 **6가지 음악 분기 패턴**
- 🔥 **에너지 업**: 더 신나고 활기찬 곡으로
- 😌 **릴렉스**: 차분하고 편안한 곡으로  
- 🎵 **유사한 곡**: 비슷한 느낌의 곡으로
- ⚡ **더 헤비하게**: 강렬하고 파워풀한 곡으로
- 💙 **감성적으로**: 감정적이고 서정적인 곡으로
- ☀️ **잠 깨는 노래**: 기운을 북돋우는 곡으로

### 🎛️ **고급 기능**
- **Audio Features 기반 유사도 계산**: Spotify의 Energy, Valence, Tempo 등을 활용
- **분기 선택/취소 토글**: 언제든지 선택을 되돌릴 수 있음
- **개발자 모드**: Audio Features 수치 변화를 실시간으로 확인
- **좋아요 비율 조절**: 새로운 곡과 익숙한 곡의 비율 조정 가능

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 16+ 
- Spotify Developer 계정 (무료)

### 설치 및 실행
```bash
# 저장소 복제
git clone https://github.com/YOUR_USERNAME/beatree-mvp.git
cd beatree-mvp

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일에 Spotify API 키 입력

# 개발 서버 실행
npm start
```

### Spotify API 설정
1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)에서 앱 생성
2. **Client ID**와 **Client Secret**를 `.env.local`에 입력
3. **Redirect URI**를 `http://localhost:3000/callback`으로 설정

## 🛠️ 기술 스택

### Frontend
- **React 18** - 모던 UI 라이브러리
- **JavaScript** - 빠른 프로토타이핑을 위한 선택
- **CSS Modules** - 컴포넌트별 스타일링
- **D3.js** - 음악 트리 시각화 (예정)

### API & 데이터
- **Spotify Web API** - 음악 데이터 및 사용자 라이브러리
- **Audio Features API** - 곡의 음향적 특성 분석
- **LocalStorage** - 세션 데이터 및 실험 로그 저장

### 핵심 알고리즘
- **유사도 계산**: Audio Features 기반 코사인 유사도
- **하이브리드 추천**: 다중 소스 조합으로 추천 품질 향상
- **분기 패턴**: 6가지 음악적 방향성 제공

## 📁 프로젝트 구조
```
beatree-mvp/
├── public/                 # 정적 파일
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── auth/          # Spotify 인증
│   │   ├── recommendation/ # 추천 시스템 UI
│   │   └── dev/           # 개발자 도구
│   ├── utils/             # 유틸리티 함수
│   │   ├── fallback/      # 대안 추천 엔진
│   │   ├── spotify.js     # Spotify API 헬퍼
│   │   └── audioFeatures.js # Audio Features 처리
│   └── styles/            # CSS 파일
├── .env.local.example     # 환경 변수 템플릿
└── README.md
```

## 🎯 MVP 개발 목표

이 프로젝트는 다음을 검증하기 위한 **Minimum Viable Product**입니다:

### ✅ 완료된 목표
- [x] Spotify API 전체 기능 탐색 및 활용
- [x] Premium 없이 작동하는 추천 시스템 구현  
- [x] Audio Feature 기반 분기 추천의 실제 효과 검증
- [x] 6가지 분기 패턴으로 다양한 음악적 방향성 제공
- [x] 사용자 친화적인 반응형 UI 구현

### 🚧 다음 단계
- [ ] 시각적 음악 트리 네트워크 구현
- [ ] 탐험 경로 저장 및 재탐색 기능
- [ ] Spotify 플레이리스트 생성 및 공유
- [ ] 협업 탐험 기능 (다중 사용자)
- [ ] 모바일 앱 전환 (React Native)

## 🧪 데이터 수집 및 실험

### 실험 데이터 구조
- **세션 기록**: 사용자 탐험 경로 및 선택 패턴
- **만족도 평가**: 각 추천에 대한 1-5점 피드백
- **Audio Feature 분석**: 효과적인 분기 패턴 발견
- **CSV 내보내기**: 데이터 분석을 위한 구조화된 출력

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트 링크: [https://github.com/YOUR_USERNAME/beatree-mvp](https://github.com/YOUR_USERNAME/beatree-mvp)

---

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**