// Audio Features 조작 및 분기 패턴 정의

// 미리 정의된 분기 패턴
export const BRANCH_PATTERNS = {
  energy_up: {
    emoji: '🔥',
    label: '에너지 업',
    description: '더 신나고 활기찬 곡으로',
    features: {
      energy: +0.3,
      valence: +0.2,
      tempo: +20
    }
  },
  relaxed: {
    emoji: '😌',
    label: '릴렉스',
    description: '차분하고 편안한 곡으로',
    features: {
      energy: -0.2,
      valence: -0.1,
      acousticness: +0.3,
      tempo: -15
    }
  },
  similar: {
    emoji: '🎵',
    label: '유사한 곡',
    description: '비슷한 느낌의 곡으로',
    features: {
      energy: 0,
      valence: 0,
      tempo: 0
    }
  },
  heavy: {
    emoji: '⚡',
    label: '더 헤비하게',
    description: '강렬하고 파워풀한 곡으로',
    features: {
      energy: +0.4,
      loudness: +0.3,
      instrumentalness: +0.2,
      tempo: +25
    }
  },
  emotional: {
    emoji: '💙',
    label: '감성적으로',
    description: '감정적이고 서정적인 곡으로',
    features: {
      valence: -0.3,
      acousticness: +0.4,
      energy: -0.2,
      tempo: -10
    }
  },
  wake_up: {
    emoji: '☀️',
    label: '잠 깨는 노래',
    description: '기운을 북돋우는 곡으로',
    features: {
      energy: +0.5,
      danceability: +0.3,
      valence: +0.4,
      tempo: +30
    }
  }
};

// Audio Feature 값 범위 제한
const clampFeature = (value, min = 0, max = 1) => {
  return Math.max(min, Math.min(max, value));
};

// 템포는 별도 처리 (일반적인 범위: 60-200 BPM)
const clampTempo = (value) => {
  return Math.max(60, Math.min(200, value));
};

// 현재 Audio Features에 분기 패턴 적용
export const applyBranchPattern = (currentFeatures, patternKey) => {
  const pattern = BRANCH_PATTERNS[patternKey];
  if (!pattern) {
    console.error(`Unknown branch pattern: ${patternKey}`);
    return currentFeatures;
  }

  const newFeatures = { ...currentFeatures };

  // 각 Feature 적용
  Object.entries(pattern.features).forEach(([feature, change]) => {
    if (feature === 'tempo') {
      newFeatures[feature] = clampTempo(currentFeatures[feature] + change);
    } else {
      newFeatures[feature] = clampFeature(currentFeatures[feature] + change);
    }
  });

  return newFeatures;
};

// 분기 추천을 위한 Spotify API 옵션 생성
export const createRecommendationOptions = (seedTrackId, targetFeatures, limit = 3) => {
  return {
    seed_tracks: [seedTrackId],
    target_energy: targetFeatures.energy,
    target_valence: targetFeatures.valence,
    target_tempo: targetFeatures.tempo,
    target_danceability: targetFeatures.danceability,
    target_acousticness: targetFeatures.acousticness,
    limit: limit
  };
};

// Audio Features 차이점 계산
export const calculateFeatureDifference = (before, after) => {
  const differences = {};
  
  const features = ['energy', 'valence', 'tempo', 'danceability', 'acousticness', 'loudness'];
  
  features.forEach(feature => {
    if (before[feature] !== undefined && after[feature] !== undefined) {
      const diff = after[feature] - before[feature];
      differences[feature] = {
        before: before[feature],
        after: after[feature],
        change: diff,
        changeFormatted: diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)
      };
    }
  });
  
  return differences;
};

// 좋아요/새곡 필터링을 위한 트랙 필터링
export const filterRecommendationsByPreference = (recommendations, savedTracks, likedRatio) => {
  if (!savedTracks || savedTracks.length === 0) {
    return recommendations; // 좋아요 목록이 없으면 모든 추천 반환
  }

  const savedTrackIds = new Set(savedTracks.map(track => track.track.id));
  const likedRecommendations = recommendations.filter(track => savedTrackIds.has(track.id));
  const newRecommendations = recommendations.filter(track => !savedTrackIds.has(track.id));

  const targetLikedCount = Math.round(recommendations.length * likedRatio);
  const targetNewCount = recommendations.length - targetLikedCount;

  // 좋아요 곡에서 선택
  const selectedLiked = likedRecommendations.slice(0, targetLikedCount);
  
  // 새곡에서 선택
  const selectedNew = newRecommendations.slice(0, targetNewCount);

  // 부족한 부분은 다른 카테고리에서 보충
  const totalSelected = [...selectedLiked, ...selectedNew];
  if (totalSelected.length < recommendations.length) {
    const remaining = recommendations.filter(track => !totalSelected.includes(track));
    totalSelected.push(...remaining.slice(0, recommendations.length - totalSelected.length));
  }

  return totalSelected;
};

// 개발자 모드용: Audio Features 표시 포맷
export const formatAudioFeatures = (features) => {
  return {
    energy: (features.energy || 0).toFixed(2),
    valence: (features.valence || 0).toFixed(2),
    tempo: Math.round(features.tempo || 0),
    danceability: (features.danceability || 0).toFixed(2),
    acousticness: (features.acousticness || 0).toFixed(2),
    loudness: (features.loudness || 0).toFixed(1)
  };
};

// 실험 데이터 로깅용 세션 생성
export const createExperimentSession = (startingTrack) => {
  return {
    session_id: `${new Date().toISOString().slice(0, 10)}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user_id: null, // Spotify 로그인 후 설정
    starting_track: {
      id: startingTrack.id,
      name: startingTrack.name,
      artist: startingTrack.artists[0]?.name || 'Unknown',
      audio_features: null // 나중에 API에서 가져와서 설정
    },
    branches: [],
    session_duration: null,
    total_satisfaction: null,
    liked_songs_ratio: 0.5 // 기본값
  };
};

export default {
  BRANCH_PATTERNS,
  applyBranchPattern,
  createRecommendationOptions,
  calculateFeatureDifference,
  filterRecommendationsByPreference,
  formatAudioFeatures,
  createExperimentSession
};