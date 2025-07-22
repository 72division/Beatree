import React, { useState, useEffect } from 'react';
import SpotifyAuth from './components/auth/SpotifyAuth';
import SeedSelector from './components/SeedSelector';
import TreeExplorer from './components/TreeExplorer';
import DevModeToggle from './components/dev/DevModeToggle';
import spotifyAPI from './utils/spotify';
import dataLogger from './utils/dataLogger';
import alternativeEngine from './utils/fallback/alternativeRecommendations';
import './styles/App.css';

function App() {
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // 앱 상태
  const [currentView, setCurrentView] = useState('seed'); // 'seed' | 'tree'
  const [selectedSeed, setSelectedSeed] = useState(null);
  
  // 개발자 모드
  const [isDevMode, setIsDevMode] = useState(false);
  
  // 사용자 데이터
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [savedTracks, setSavedTracks] = useState([]);
  const [likedSongsRatio, setLikedSongsRatio] = useState(0.5);
  
  // 로딩 상태
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  useEffect(() => {
    // 초기 로드 시 인증 상태 확인
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    // 저장된 토큰 확인 (SpotifyAuth 컴포넌트에서 처리하므로 여기서는 간단히)
    if (spotifyAPI.loadStoredToken()) {
      try {
        const profile = await spotifyAPI.getUserProfile();
        setUserProfile(profile);
        setIsAuthenticated(true);
        loadUserData();
      } catch (error) {
        console.log('Stored token invalid, clearing...');
        spotifyAPI.clearToken();
        setIsAuthenticated(false);
      }
    }
  };

  const handleAuthSuccess = async (profile) => {
    console.log('Auth success in App.js:', profile);
    setUserProfile(profile);
    setIsAuthenticated(true);
    loadUserData();
  };

  const handleAuthError = (error) => {
    console.error('Auth error in App.js:', error);
    setIsAuthenticated(false);
    alert('인증 중 오류가 발생했습니다: ' + error);
  };

  const loadUserData = async () => {
    setIsLoadingUserData(true);
    try {
      console.log('Loading user data...');
      
      // 플레이리스트와 좋아요 목록 병렬로 로드
      const [playlistsResponse, savedTracksResponse] = await Promise.all([
        spotifyAPI.getUserPlaylists(50),
        spotifyAPI.getUserSavedTracks(50)
      ]);

      setUserPlaylists(playlistsResponse.items || []);
      setSavedTracks(savedTracksResponse.items || []);
      
      console.log('User data loaded successfully:', {
        playlists: playlistsResponse.items?.length || 0,
        savedTracks: savedTracksResponse.items?.length || 0
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      alert('사용자 데이터를 불러오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleSeedSelected = async (seedTrack) => {
    try {
      console.log('Selected seed track:', seedTrack);
      
      // Audio Features 가져오기
      const audioFeatures = await spotifyAPI.getAudioFeatures(seedTrack.id);
      const trackWithFeatures = {
        ...seedTrack,
        audio_features: audioFeatures
      };

      setSelectedSeed(trackWithFeatures);
      setCurrentView('tree');

      // 실험 세션 시작
      dataLogger.startSession(seedTrack, userProfile?.id);
      dataLogger.setStartingTrackFeatures(audioFeatures);
      dataLogger.setLikedSongsRatio(likedSongsRatio);
      dataLogger.setDevModeEnabled(isDevMode);

      console.log('Started exploration with track:', trackWithFeatures);
    } catch (error) {
      console.error('Failed to start exploration:', error);
      alert('곡을 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleBackToSeed = () => {
    // 세션 종료
    const completedSession = dataLogger.endSession();
    if (completedSession) {
      console.log('Session completed:', completedSession);
    }

    setCurrentView('seed');
    setSelectedSeed(null);
  };

  const handleDevModeToggle = (e) => {
    const enabled = e.target.checked;
    setIsDevMode(enabled);
    
    // 현재 세션이 있으면 개발자 모드 상태 기록
    dataLogger.setDevModeEnabled(enabled);
    
    console.log('Dev mode:', enabled ? 'enabled' : 'disabled');
  };

  const handleLikedRatioChange = (ratio) => {
    setLikedSongsRatio(ratio);
    dataLogger.setLikedSongsRatio(ratio);
  };

  // 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated) {
    return (
      <div className="App">
        <SpotifyAuth 
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />
      </div>
    );
  }

  return (
    <div className="App">
      {/* 개발자 모드 토글 */}
      <DevModeToggle 
        isEnabled={isDevMode}
        onToggle={handleDevModeToggle}
      />

      {/* 메인 콘텐츠 */}
      {currentView === 'seed' && (
        <SeedSelector 
          onSeedSelected={handleSeedSelected}
          userPlaylists={userPlaylists}
          savedTracks={savedTracks}
          isLoadingUserData={isLoadingUserData}
          userProfile={userProfile}
          likedSongsRatio={likedSongsRatio}
          onLikedRatioChange={handleLikedRatioChange}
          isDevMode={isDevMode}
        />
      )}
      
      {currentView === 'tree' && selectedSeed && (
        <TreeExplorer 
          seedTrack={selectedSeed}
          onBackToSeed={handleBackToSeed}
          savedTracks={savedTracks}
          likedSongsRatio={likedSongsRatio}
          onLikedRatioChange={handleLikedRatioChange}
          isDevMode={isDevMode}
          userProfile={userProfile}
        />
      )}

      {/* 글로벌 스타일 및 배경 */}
      <div className="app-background">
        <div className="background-pattern"></div>
      </div>
    </div>
  );
}

export default App;