import React, { useState, useEffect } from 'react';
import spotifyAPI from '../../utils/spotify';
import './SpotifyAuth.css';

const SpotifyAuth = ({ onAuthSuccess, onAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [authStep, setAuthStep] = useState('initial'); // 'initial', 'loading', 'success', 'error'

  useEffect(() => {
    // 컴포넌트 마운트 시 토큰 확인
    checkForToken();
  }, []);

  const checkForToken = async () => {
    // URL에서 authorization code와 state 확인
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    console.log('Checking for token...', { 
      code: code ? code.substring(0, 10) + '...' : null, 
      error, 
      state: state ? state.substring(0, 10) + '...' : null 
    });

    if (error) {
      console.error('Spotify auth error:', error);
      setAuthStep('error');
      onAuthError(error);
      // URL 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state) {
      // 인증 코드와 state가 있으면 토큰 교환 시도
      try {
        console.log('Found authorization code and state, starting token exchange...');
        setIsLoading(true);
        setAuthStep('loading');
        
        // State에서 code verifier를 추출하여 토큰 교환
        await spotifyAPI.exchangeCodeForToken(code, state);
        const profile = await spotifyAPI.getUserProfile();
        
        console.log('Successfully got user profile:', profile.display_name);
        
        setUserProfile(profile);
        setAuthStep('success');
        onAuthSuccess(profile);
        
        // URL 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Token exchange failed:', error);
        setAuthStep('error');
        onAuthError(error.message);
        // URL 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (code && !state) {
      console.error('Authorization code found but state parameter missing');
      setAuthStep('error');
      onAuthError('Missing state parameter. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // 저장된 토큰 확인
    if (spotifyAPI.loadStoredToken()) {
      try {
        setIsLoading(true);
        console.log('Loading stored token...');
        const profile = await spotifyAPI.getUserProfile();
        console.log('Stored token valid, got profile:', profile.display_name);
        setUserProfile(profile);
        setAuthStep('success');
        onAuthSuccess(profile);
      } catch (error) {
        console.log('Stored token invalid, clearing...', error);
        spotifyAPI.clearToken();
        setAuthStep('initial');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogin = async () => {
    try {
      // 기존 데이터 정리
      spotifyAPI.clearToken();
      
      console.log('Generating auth URL...');
      const authUrl = await spotifyAPI.getAuthUrl();
      console.log('Redirecting to Spotify auth...');
      
      // 현재 탭에서 리다이렉트
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to generate auth URL:', error);
      setAuthStep('error');
      onAuthError(error.message);
    }
  };

  const handleLogout = () => {
    spotifyAPI.clearToken();
    setUserProfile(null);
    setAuthStep('initial');
    // 페이지 새로고침으로 완전히 초기화
    window.location.reload();
  };

  const handleRetry = () => {
    // 완전히 초기화하고 다시 시도
    spotifyAPI.clearToken();
    setAuthStep('initial');
    setIsLoading(false);
    setUserProfile(null);
    
    // URL 파라미터 제거
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // 약간의 지연 후 로그인 시도
    setTimeout(() => {
      handleLogin();
    }, 500);
  };

  if (isLoading || authStep === 'loading') {
    return (
      <div className="spotify-auth loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>🎵 Spotify 연결 중...</h2>
          <p>Spotify에서 권한을 확인하고 있습니다</p>
          <p style={{ fontSize: '0.9em', opacity: 0.7 }}>
            잠시만 기다려주세요...
          </p>
        </div>
      </div>
    );
  }

  if (authStep === 'error') {
    return (
      <div className="spotify-auth error">
        <div className="error-container">
          <h2>❌ 연결 실패</h2>
          <p>Spotify 연결 중 오류가 발생했습니다.</p>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '15px', 
            borderRadius: '10px', 
            margin: '15px 0',
            fontSize: '0.9em' 
          }}>
            <p>💡 <strong>해결 방법:</strong></p>
            <ul style={{ textAlign: 'left', margin: '10px 0', paddingLeft: '20px' }}>
              <li>현재 브라우저 창에서 로그인을 완료해주세요</li>
              <li>새 탭이나 창을 열지 마세요</li>
              <li>팝업 차단이 해제되어 있는지 확인해주세요</li>
            </ul>
          </div>
          <button 
            className="btn primary"
            onClick={handleRetry}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (authStep === 'success' && userProfile) {
    return (
      <div className="spotify-auth success">
        <div className="user-profile">
          <div className="profile-info">
            {userProfile.images && userProfile.images[0] && (
              <img 
                src={userProfile.images[0].url} 
                alt="Profile" 
                className="profile-image"
              />
            )}
            <div className="profile-details">
              <h3>안녕하세요, {userProfile.display_name}님!</h3>
              <p className="profile-type">
                {userProfile.product === 'premium' ? '🌟 Premium' : '🎵 Free'} 계정
              </p>
              <p className="followers">
                팔로워 {userProfile.followers.total.toLocaleString()}명
              </p>
            </div>
          </div>
          <button 
            className="btn secondary logout-btn"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  // 초기 로그인 화면
  return (
    <div className="spotify-auth initial">
      <div className="login-container">
        <div className="logo-section">
          <h1>🎵 Beatree</h1>
          <p className="subtitle">음악을 탐험하는 새로운 방법</p>
        </div>
        
        <div className="features-preview">
          <div className="feature">
            <span className="feature-icon">🔥</span>
            <span>동적 음악 분기</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎯</span>
            <span>Audio Feature 기반 추천</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📊</span>
            <span>탐험 데이터 분석</span>
          </div>
        </div>

        <div className="auth-info">
          <h3>🎧 시작하려면 Spotify 계정이 필요합니다</h3>
          <div className="auth-benefits">
            <p>✅ 30초 미리듣기 (무료 계정)</p>
            <p>✅ 전체 곡 재생 (Premium 계정)</p>
            <p>✅ 플레이리스트 접근</p>
            <p>✅ 좋아요 목록 활용</p>
          </div>
        </div>

        <button 
          className="btn primary spotify-login-btn"
          onClick={handleLogin}
        >
          <span className="spotify-icon">🎵</span>
          Spotify로 로그인
        </button>

        <div className="privacy-note">
          <p>🔒 Beatree는 음악 청취 데이터만 사용하며, 개인정보를 저장하지 않습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default SpotifyAuth;