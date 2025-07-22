import React, { useState, useEffect } from 'react';
import BranchButtons from './recommendation/BranchButtons';
import AudioFeatureTable from './recommendation/AudioFeatureTable';
import LikedSongsSlider from './recommendation/LikedSongsSlider';
import spotifyAPI from '../utils/spotify';
import dataLogger from '../utils/dataLogger';
import { applyBranchPattern, createRecommendationOptions, filterRecommendationsByPreference, BRANCH_PATTERNS } from '../utils/audioFeatures';
import alternativeEngine from '../utils/fallback/alternativeRecommendations';
import '../styles/TreeExplorer.css';

const TreeExplorer = ({
  seedTrack,
  onBackToSeed,
  savedTracks = [],
  likedSongsRatio = 0.5,
  onLikedRatioChange,
  isDevMode = false,
  userProfile
}) => {
  // 현재 트랙 상태
  const [currentTrack, setCurrentTrack] = useState(seedTrack);
  
  // 추천 상태
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  
  // 탐험 히스토리
  const [explorationHistory, setExplorationHistory] = useState([]);
  
  // Audio Feature 상태
  const [beforeFeatures, setBeforeFeatures] = useState(null);
  const [afterFeatures, setAfterFeatures] = useState(null);
  
  // 미리듣기 상태
  const [playingTrack, setPlayingTrack] = useState(null);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    if (seedTrack) {
      setCurrentTrack(seedTrack);
      setBeforeFeatures(seedTrack.audio_features);
      // 대안 엔진 초기화 및 추천 로드
      initializeAndLoadRecommendations();
    }
  }, [seedTrack]);

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 오디오 정리
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  // 대안 엔진 초기화 및 추천 로드
  const initializeAndLoadRecommendations = async () => {
    if (!seedTrack) return;

    setIsLoadingRecommendations(true);
    try {
      // 사용자 플레이리스트에서 플레이리스트 목록 가져오기
      const userPlaylists = await spotifyAPI.getUserPlaylists(10);
      
      // 대안 엔진 초기화
      await alternativeEngine.initializeUserLibrary(
        userPlaylists.items || [],
        savedTracks || []
      );
      
      // 초기 추천 로드 (하이브리드 방식)
      const initialRecommendations = await loadAlternativeRecommendations(seedTrack, 'similar');
      setRecommendations(initialRecommendations);
      
      console.log('Alternative recommendations loaded:', initialRecommendations.length);
    } catch (error) {
      console.error('Failed to load alternative recommendations:', error);
      // 최후 수단: 목업 데이터
      const mockRecommendations = generateMockRecommendations(seedTrack);
      setRecommendations(mockRecommendations);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // 대안 추천 로드
  const loadAlternativeRecommendations = async (track, patternKey) => {
    try {
      const pattern = BRANCH_PATTERNS[patternKey];
      if (!pattern) {
        console.error('Unknown pattern:', patternKey);
        return [];
      }

      // 하이브리드 추천 시스템 사용
      const recommendations = await alternativeEngine.getHybridRecommendations(
        track,
        pattern,
        6 // 6개 추천곡
      );

      return recommendations;
    } catch (error) {
      console.error('Alternative recommendation failed:', error);
      return [];
    }
  };

  // 목업 추천 생성
  const generateMockRecommendations = (baseTrack) => {
    const mockTracks = [
      { id: 'mock1', name: '추천곡 1', artists: [{ name: '아티스트 A' }], preview_url: null },
      { id: 'mock2', name: '추천곡 2', artists: [{ name: '아티스트 B' }], preview_url: null },
      { id: 'mock3', name: '추천곡 3', artists: [{ name: '아티스트 C' }], preview_url: null },
    ];
    return mockTracks;
  };

  // 분기 선택 처리 (대안 시스템 사용)
  const handleBranchSelect = async (patternKey) => {
    if (!currentTrack) {
      alert('현재 트랙 정보가 없습니다.');
      return;
    }

    console.log('Branch selected:', patternKey);
    console.log('Current track:', currentTrack.name);

    // 이미 선택된 분기인지 확인 (토글 기능)
    if (selectedBranches.includes(patternKey)) {
      // 분기 선택 취소
      const newSelectedBranches = selectedBranches.filter(b => b !== patternKey);
      setSelectedBranches(newSelectedBranches);
      setAfterFeatures(null); // 원래 상태로 복원
      
      // 기본 추천으로 되돌리기
      const defaultRecs = await loadAlternativeRecommendations(currentTrack, 'similar');
      setRecommendations(defaultRecs);
      console.log('Branch deselected, returning to default recommendations');
      return;
    }

    try {
      setIsLoadingRecommendations(true);
      
      // 다른 선택된 분기들을 모두 해제하고 새로운 분기만 선택
      setSelectedBranches([patternKey]);

      // Audio Features 변경 적용 (가시화용)
      if (currentTrack.audio_features) {
        const newFeatures = applyBranchPattern(currentTrack.audio_features, patternKey);
        setAfterFeatures(newFeatures);
        console.log('Applied features for pattern:', patternKey, newFeatures);
      }

      // 대안 추천 시스템으로 새로운 추천 생성
      console.log('Loading recommendations for pattern:', patternKey);
      const branchRecommendations = await loadAlternativeRecommendations(currentTrack, patternKey);
      
      console.log('Raw recommendations:', branchRecommendations.length);
      
      // 좋아요 비율에 따라 필터링
      const filteredRecommendations = filterRecommendationsByPreference(
        branchRecommendations,
        savedTracks,
        likedSongsRatio
      );

      console.log('Filtered recommendations:', filteredRecommendations.length);

      // 데이터 로깅
      const branchData = {
        patternKey,
        pattern: BRANCH_PATTERNS[patternKey],
        featureChanges: afterFeatures,
        recommendedTracks: filteredRecommendations
      };
      dataLogger.logBranchSelection(branchData);

      // 추천 결과 표시
      setRecommendations(filteredRecommendations);
      
      console.log(`Branch ${patternKey} selected (alternative), new recommendations:`, filteredRecommendations.length);
    } catch (error) {
      console.error('Branch selection failed:', error);
      
      // 에러 시 보다 친근한 메시지
      const pattern = BRANCH_PATTERNS[patternKey];
      alert(`${pattern?.label || '해당'} 분기의 추천곡을 찾는 중 문제가 발생했습니다. 다른 분기를 시도해보세요.`);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };



  // 추천곡 선택 처리
  const handleTrackSelect = async (track) => {
    try {
      // Audio Features 가져오기
      const audioFeatures = await spotifyAPI.getAudioFeatures(track.id);
      const trackWithFeatures = {
        ...track,
        audio_features: audioFeatures
      };

      // 히스토리에 추가
      setExplorationHistory([...explorationHistory, currentTrack]);
      
      // 현재 트랙 업데이트
      setCurrentTrack(trackWithFeatures);
      setBeforeFeatures(trackWithFeatures.audio_features);
      setAfterFeatures(null);
      setSelectedBranches([]);

      // 새로운 추천 로드
      loadRecommendationsForTrack(trackWithFeatures);
      
      console.log('Selected new track:', trackWithFeatures.name);
    } catch (error) {
      console.error('Track selection failed:', error);
      alert('곡 선택 중 오류가 발생했습니다.');
    }
  };

  // 특정 트랙에 대한 추천 로드 (대안 시스템)
  const loadRecommendationsForTrack = async (track) => {
    setIsLoadingRecommendations(true);
    try {
      // 기본 'similar' 패턴으로 추천
      const recommendations = await loadAlternativeRecommendations(track, 'similar');
      
      const filteredTracks = filterRecommendationsByPreference(
        recommendations,
        savedTracks,
        likedSongsRatio
      );
      
      setRecommendations(filteredTracks.slice(0, 6));
    } catch (error) {
      console.error('Failed to load recommendations for track:', error);
      const mockRecommendations = generateMockRecommendations(track);
      setRecommendations(mockRecommendations);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // 미리듣기 처리
  const handlePreviewPlay = (track) => {
    if (!track.preview_url) {
      alert('이 곡은 미리듣기를 지원하지 않습니다.');
      return;
    }

    // 기존 오디오 정지
    if (audio) {
      audio.pause();
    }

    if (playingTrack === track.id) {
      // 같은 곡이면 정지
      setPlayingTrack(null);
      setAudio(null);
    } else {
      // 새로운 곡 재생
      const newAudio = new Audio(track.preview_url);
      newAudio.play();
      setPlayingTrack(track.id);
      setAudio(newAudio);
      
      newAudio.onended = () => {
        setPlayingTrack(null);
        setAudio(null);
      };
    }
  };

  // 만족도 평가
  const handleSatisfactionRating = (trackId, rating) => {
    // 현재 분기에 대한 만족도 기록
    const currentBranchIndex = explorationHistory.length;
    dataLogger.logSatisfactionScore(currentBranchIndex, trackId, rating);
    console.log(`Satisfaction rating for ${trackId}: ${rating}`);
  };

  // 뒤로 가기 (이전 노드)
  const handleGoBack = () => {
    if (explorationHistory.length > 0) {
      const previousTrack = explorationHistory[explorationHistory.length - 1];
      const newHistory = explorationHistory.slice(0, -1);
      
      setExplorationHistory(newHistory);
      setCurrentTrack(previousTrack);
      setBeforeFeatures(previousTrack.audio_features);
      setAfterFeatures(null);
      setSelectedBranches([]);
      
      loadRecommendationsForTrack(previousTrack);
    } else {
      // 처음 시드로 돌아가기
      onBackToSeed();
    }
  };

  return (
    <div className="tree-explorer">
      <div className="tree-explorer-container">
        {/* 헤더 */}
        <div className="explorer-header">
          <button className="back-button" onClick={handleGoBack}>
            ← {explorationHistory.length > 0 ? '이전 곡' : '시드 선택'}
          </button>
          <h2>🎵 음악 탐험 중</h2>
          <div className="exploration-depth">
            깊이: {explorationHistory.length + 1}
          </div>
        </div>

        {/* 현재 곡 정보 */}
        <div className="current-track">
          <div className="track-display">
            {currentTrack?.album?.images?.[0] && (
              <img 
                src={currentTrack.album.images[0].url} 
                alt={currentTrack.album.name}
                className="current-track-image"
              />
            )}
            <div className="track-info">
              <h3>{currentTrack?.name || 'Unknown Track'}</h3>
              <p>{currentTrack?.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}</p>
              <p className="album-info">{currentTrack?.album?.name || 'Unknown Album'}</p>
            </div>
            {currentTrack?.preview_url && (
              <button 
                className={`preview-button ${playingTrack === currentTrack.id ? 'playing' : ''}`}
                onClick={() => handlePreviewPlay(currentTrack)}
              >
                {playingTrack === currentTrack.id ? '⏸️' : '▶️'}
              </button>
            )}
          </div>
        </div>

        {/* Audio Feature 테이블 (개발자 모드) */}
        {isDevMode && beforeFeatures && (
          <AudioFeatureTable
            beforeFeatures={beforeFeatures}
            afterFeatures={afterFeatures || beforeFeatures}
            isVisible={true}
            title={afterFeatures ? "Audio Features 변화" : "현재 곡의 Audio Features"}
          />
        )}

        {/* 좋아요 비율 슬라이더 */}
        <LikedSongsSlider
          value={likedSongsRatio}
          onChange={onLikedRatioChange}
          savedTracksCount={savedTracks.length}
          totalRecommendations={3}
        />

        {/* 분기 선택 버튼 */}
        <BranchButtons
          currentTrack={currentTrack}
          onBranchSelect={handleBranchSelect}
          isDevMode={isDevMode}
          isLoading={isLoadingRecommendations}
          selectedBranches={selectedBranches}
        />

        {/* 추천 곡 목록 */}
        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h3>추천 곡</h3>
            <div className="recommendations-grid">
              {recommendations.slice(0, 6).map((track, index) => (
                <div key={track.id} className="recommendation-item">
                  <div className="track-card" onClick={() => handleTrackSelect(track)}>
                    {track.album?.images?.[0] && (
                      <img 
                        src={track.album.images[0].url} 
                        alt={track.album.name}
                        className="recommendation-image"
                      />
                    )}
                    <div className="recommendation-info">
                      <h4>{track.name}</h4>
                      <p>{track.artists?.map(a => a.name).join(', ')}</p>
                    </div>
                    <div className="recommendation-actions">
                      {track.preview_url && (
                        <button 
                          className={`mini-preview-button ${playingTrack === track.id ? 'playing' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewPlay(track);
                          }}
                        >
                          {playingTrack === track.id ? '⏸️' : '▶️'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* 만족도 평가 */}
                  <div className="satisfaction-rating">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        className="rating-star"
                        onClick={() => handleSatisfactionRating(track.id, rating)}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoadingRecommendations && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>새로운 추천곡을 찾고 있습니다...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeExplorer;