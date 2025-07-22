// Premium 없이 작동하는 대안 추천 시스템
// 사용자의 플레이리스트, 좋아요 목록, 검색 결과를 활용

import spotifyAPI from '../spotify';

class AlternativeRecommendationEngine {
  constructor() {
    this.userTracks = new Map(); // 사용자의 모든 트랙 캐시
    this.audioFeaturesCache = new Map(); // Audio Features 캐시
    this.initialized = false;
  }

  // 사용자 라이브러리 초기화
  async initializeUserLibrary(userPlaylists = [], savedTracks = []) {
    console.log('Initializing alternative recommendation engine...');
    
    try {
      // 좋아요한 곡들 추가
      savedTracks.forEach(item => {
        if (item.track) {
          this.userTracks.set(item.track.id, {
            ...item.track,
            source: 'saved',
            popularity_score: 1.0
          });
        }
      });

      // 플레이리스트 곡들 추가 (일부만)
      for (const playlist of userPlaylists.slice(0, 5)) {
        try {
          const tracks = await spotifyAPI.getPlaylistTracks(playlist.id, 20);
          tracks.items?.forEach(item => {
            if (item.track && item.track.id && !this.userTracks.has(item.track.id)) {
              this.userTracks.set(item.track.id, {
                ...item.track,
                source: 'playlist',
                popularity_score: 0.7
              });
            }
          });
        } catch (error) {
          console.warn(`Failed to load playlist ${playlist.name}:`, error);
        }
      }

      this.initialized = true;
      console.log(`Alternative engine initialized with ${this.userTracks.size} tracks`);
      
    } catch (error) {
      console.error('Failed to initialize alternative engine:', error);
    }
  }

  // Audio Features 기반 유사도 계산
  calculateSimilarity(features1, features2) {
    if (!features1 || !features2) return 0;

    const weights = {
      energy: 0.25,
      valence: 0.25,
      danceability: 0.20,
      tempo: 0.15,
      acousticness: 0.10,
      instrumentalness: 0.05
    };

    let similarity = 0;
    let totalWeight = 0;

    for (const [feature, weight] of Object.entries(weights)) {
      if (features1[feature] !== undefined && features2[feature] !== undefined) {
        let diff;
        if (feature === 'tempo') {
          // Tempo는 범위가 다르므로 정규화
          diff = Math.abs(features1[feature] - features2[feature]) / 100;
        } else {
          diff = Math.abs(features1[feature] - features2[feature]);
        }
        similarity += (1 - Math.min(diff, 1)) * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  // 브랜치 패턴에 따른 추천
  async getRecommendationsByBranch(seedTrack, branchPattern, count = 3) {
    if (!this.initialized) {
      console.warn('Alternative engine not initialized, using search fallback');
      return this.getRecommendationsBySearch(seedTrack, count);
    }

    try {
      // 시드 트랙의 Audio Features
      let seedFeatures = seedTrack.audio_features;
      if (!seedFeatures) {
        seedFeatures = await spotifyAPI.getAudioFeatures(seedTrack.id);
      }

      // 브랜치 패턴 적용
      const targetFeatures = this.applyBranchPattern(seedFeatures, branchPattern);
      
      // 사용자 라이브러리에서 유사한 곡 찾기
      const candidates = [];
      
      for (const [trackId, track] of this.userTracks.entries()) {
        if (trackId === seedTrack.id) continue; // 시드 트랙 제외
        
        // Audio Features 가져오기 (캐시 활용)
        let trackFeatures = this.audioFeaturesCache.get(trackId);
        if (!trackFeatures) {
          try {
            trackFeatures = await spotifyAPI.getAudioFeatures(trackId);
            this.audioFeaturesCache.set(trackId, trackFeatures);
          } catch (error) {
            continue; // 실패하면 스킵
          }
        }

        // 유사도 계산
        const similarity = this.calculateSimilarity(targetFeatures, trackFeatures);
        
        if (similarity > 0.3) { // 최소 유사도 임계값
          candidates.push({
            track,
            similarity,
            popularity_score: track.popularity_score || 0.5
          });
        }
      }

      // 유사도와 인기도를 결합한 점수로 정렬
      candidates.sort((a, b) => {
        const scoreA = a.similarity * 0.7 + a.popularity_score * 0.3;
        const scoreB = b.similarity * 0.7 + b.popularity_score * 0.3;
        return scoreB - scoreA;
      });

      const recommendations = candidates.slice(0, count).map(c => c.track);
      
      // 부족하면 검색으로 보완
      if (recommendations.length < count) {
        const searchResults = await this.getRecommendationsBySearch(seedTrack, count - recommendations.length);
        recommendations.push(...searchResults);
      }

      console.log(`Alternative recommendations for ${branchPattern.name}:`, recommendations.length);
      return recommendations;

    } catch (error) {
      console.error('Alternative recommendation failed:', error);
      return this.getRecommendationsBySearch(seedTrack, count);
    }
  }

  // 브랜치 패턴 적용
  applyBranchPattern(features, pattern) {
    const result = { ...features };

    console.log('Applying pattern:', pattern.label, 'to features:', features);

    if (pattern.features) {
      Object.entries(pattern.features).forEach(([feature, change]) => {
        if (feature === 'tempo') {
          result.tempo = Math.max(60, Math.min(200, features.tempo + change));
        } else {
          result[feature] = Math.max(0, Math.min(1, features[feature] + change));
        }
      });
    }

    console.log('Pattern applied, new features:', result);
    return result;
  }

  // 검색 기반 추천 (최후 수단)
  async getRecommendationsBySearch(seedTrack, count = 3) {
    try {
      const artistName = seedTrack.artists?.[0]?.name;
      if (!artistName) return [];

      // 아티스트명으로 검색
      const searchResults = await spotifyAPI.searchTracks(`artist:"${artistName}"`, count * 2);
      
      const tracks = searchResults.tracks?.items?.filter(track => 
        track.id !== seedTrack.id && // 시드 트랙 제외
        track.preview_url // 미리듣기 가능한 곡만
      ) || [];

      return tracks.slice(0, count);
    } catch (error) {
      console.error('Search fallback failed:', error);
      return [];
    }
  }

  // 관련 아티스트 검색 추천
  async getRecommendationsByRelatedArtists(seedTrack, count = 3) {
    try {
      const artist = seedTrack.artists?.[0];
      if (!artist) return [];

      // 비슷한 장르나 스타일의 곡들 검색
      const genres = ['pop', 'rock', 'indie', 'electronic', 'hip-hop', 'r&b'];
      const randomGenre = genres[Math.floor(Math.random() * genres.length)];
      
      const searchResults = await spotifyAPI.searchTracks(`genre:"${randomGenre}"`, count * 2);
      
      const tracks = searchResults.tracks?.items?.filter(track => 
        track.id !== seedTrack.id &&
        track.preview_url &&
        !track.artists.some(a => a.id === artist.id) // 같은 아티스트 제외
      ) || [];

      return tracks.slice(0, count);
    } catch (error) {
      console.error('Related artist search failed:', error);
      return [];
    }
  }

  // 하이브리드 추천 (여러 방법 조합)
  async getHybridRecommendations(seedTrack, branchPattern, count = 3) {
    console.log('Getting hybrid recommendations for:', seedTrack.name, 'pattern:', branchPattern.label);
    
    const recommendations = [];
    
    try {
      // 1. 라이브러리 기반 추천 (50%)
      const libraryRecs = await this.getRecommendationsByBranch(seedTrack, branchPattern, Math.ceil(count * 0.5));
      recommendations.push(...libraryRecs);
      console.log('Library recommendations:', libraryRecs.length);

      // 2. 검색 기반 추천 (30%)
      if (recommendations.length < count) {
        const searchRecs = await this.getRecommendationsBySearch(seedTrack, Math.ceil(count * 0.3));
        recommendations.push(...searchRecs);
        console.log('Search recommendations:', searchRecs.length);
      }

      // 3. 관련 아티스트 추천 (20%)
      if (recommendations.length < count) {
        const artistRecs = await this.getRecommendationsByRelatedArtists(seedTrack, count - recommendations.length);
        recommendations.push(...artistRecs);
        console.log('Artist recommendations:', artistRecs.length);
      }

      // 중복 제거
      const uniqueRecommendations = recommendations.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );

      console.log('Total unique recommendations before fallback:', uniqueRecommendations.length);

      // 부족하면 목업 데이터로 보강
      if (uniqueRecommendations.length < count) {
        const mockRecs = this.generateMockRecommendations(seedTrack, branchPattern, count - uniqueRecommendations.length);
        uniqueRecommendations.push(...mockRecs);
        console.log('Added mock recommendations:', mockRecs.length);
      }

      const finalResult = uniqueRecommendations.slice(0, count);
      console.log('Final recommendations count:', finalResult.length);
      return finalResult;
      
    } catch (error) {
      console.error('Hybrid recommendation failed:', error);
      // 완전히 실패할 경우 목업 데이터 반환
      return this.generateMockRecommendations(seedTrack, branchPattern, count);
    }
  }

  // 목업 추천 생성 (폴백용)
  generateMockRecommendations(seedTrack, branchPattern, count = 3) {
    console.log('Generating mock recommendations for pattern:', branchPattern.label);
    
    const mockTracks = [
      {
        id: `mock_${Date.now()}_1`,
        name: `${branchPattern.emoji} 분기 추천곡 1`,
        artists: [{ name: '예시 아티스트 A', id: 'mock_artist_1' }],
        album: {
          name: '예시 앨범',
          images: [{ url: 'https://via.placeholder.com/300x300/1db954/white?text=Mock+1' }]
        },
        preview_url: null,
        external_urls: { spotify: '#' },
        popularity: 75
      },
      {
        id: `mock_${Date.now()}_2`,
        name: `${branchPattern.emoji} 분기 추천곡 2`,
        artists: [{ name: '예시 아티스트 B', id: 'mock_artist_2' }],
        album: {
          name: '예시 앨범 2',
          images: [{ url: 'https://via.placeholder.com/300x300/ffd700/black?text=Mock+2' }]
        },
        preview_url: null,
        external_urls: { spotify: '#' },
        popularity: 68
      },
      {
        id: `mock_${Date.now()}_3`,
        name: `${branchPattern.emoji} 분기 추천곡 3`,
        artists: [{ name: '예시 아티스트 C', id: 'mock_artist_3' }],
        album: {
          name: '예시 앨범 3',
          images: [{ url: 'https://via.placeholder.com/300x300/ff6b6b/white?text=Mock+3' }]
        },
        preview_url: null,
        external_urls: { spotify: '#' },
        popularity: 82
      },
      {
        id: `mock_${Date.now()}_4`,
        name: `${branchPattern.emoji} 분기 추천곡 4`,
        artists: [{ name: '예시 아티스트 D', id: 'mock_artist_4' }],
        album: {
          name: '예시 앨범 4',
          images: [{ url: 'https://via.placeholder.com/300x300/4ecdc4/white?text=Mock+4' }]
        },
        preview_url: null,
        external_urls: { spotify: '#' },
        popularity: 71
      },
      {
        id: `mock_${Date.now()}_5`,
        name: `${branchPattern.emoji} 분기 추천곡 5`,
        artists: [{ name: '예시 아티스트 E', id: 'mock_artist_5' }],
        album: {
          name: '예시 앨범 5',
          images: [{ url: 'https://via.placeholder.com/300x300/a8e6cf/black?text=Mock+5' }]
        },
        preview_url: null,
        external_urls: { spotify: '#' },
        popularity: 79
      },
      {
        id: `mock_${Date.now()}_6`,
        name: `${branchPattern.emoji} 분기 추천곡 6`,
        artists: [{ name: '예시 아티스트 F', id: 'mock_artist_6' }],
        album: {
          name: '예시 앨범 6',
          images: [{ url: 'https://via.placeholder.com/300x300/ffaaa5/black?text=Mock+6' }]
        },
        preview_url: null,
        external_urls: { spotify: '#' },
        popularity: 84
      }
    ];

    return mockTracks.slice(0, count);
  }
}

// 싱글톤 인스턴스
const alternativeEngine = new AlternativeRecommendationEngine();

export default alternativeEngine;