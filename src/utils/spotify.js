// Spotify Web API 헬퍼 함수들 (403 오류 해결용 목업 데이터 추가)

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;

class SpotifyAPI {
  constructor() {
    this.accessToken = null;
    this.tokenType = 'Bearer';
  }

  // 목업 Audio Features 생성
  generateMockAudioFeatures(trackId) {
    // 트랙 ID를 시드로 사용하여 일관된 값 생성
    const seed = trackId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const random = (seed * 9301 + 49297) % 233280 / 233280;
    
    return {
      acousticness: Math.round((0.1 + random * 0.8) * 100) / 100,
      danceability: Math.round((0.2 + random * 0.7) * 100) / 100,
      energy: Math.round((0.1 + random * 0.8) * 100) / 100,
      instrumentalness: Math.round((random * 0.3) * 100) / 100,
      key: Math.floor(random * 12),
      liveness: Math.round((random * 0.4) * 100) / 100,
      loudness: Math.round((-20 + random * 15) * 100) / 100,
      mode: Math.round(random),
      speechiness: Math.round((random * 0.3) * 100) / 100,
      tempo: Math.round(80 + random * 120),
      time_signature: 4,
      valence: Math.round((0.1 + random * 0.8) * 100) / 100,
    };
  }

  // PKCE를 위한 코드 생성
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // PKCE Code Challenge 생성
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Base64 URL Safe 인코딩
  base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Base64 URL Safe 디코딩
  base64UrlDecode(str) {
    // 패딩 추가
    str += '='.repeat((4 - str.length % 4) % 4);
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }

  // OAuth 로그인 URL 생성 (State에 Code Verifier 포함)
  async getAuthUrl() {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-library-modify'
    ];

    // PKCE 코드 생성
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Code Verifier를 state 파라미터에 인코딩 (보안을 위해 timestamp 추가)
    const stateData = {
      verifier: codeVerifier,
      timestamp: Date.now()
    };
    const state = this.base64UrlEncode(JSON.stringify(stateData));
    
    console.log('Generated code verifier and challenge');

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: scopes.join(' '),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true',
      state: state
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // State에서 Code Verifier 추출
  extractCodeVerifierFromState(state) {
    try {
      const stateData = JSON.parse(this.base64UrlDecode(state));
      const now = Date.now();
      const stateAge = now - stateData.timestamp;
      
      // 10분 이상 오래된 state는 거부
      if (stateAge > 10 * 60 * 1000) {
        throw new Error('State parameter too old');
      }
      
      return stateData.verifier;
    } catch (error) {
      console.error('Failed to extract code verifier from state:', error);
      return null;
    }
  }

  // Authorization Code를 Access Token으로 교환
  async exchangeCodeForToken(code, state) {
    console.log('Starting token exchange...');
    
    // State에서 Code Verifier 추출
    const codeVerifier = this.extractCodeVerifierFromState(state);
    
    if (!codeVerifier) {
      throw new Error('Invalid or expired state parameter. Please try logging in again.');
    }

    console.log('Code verifier extracted from state successfully');

    try {
      const requestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      });

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody
      });

      console.log('Token response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token exchange error:', errorData);
        throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
      }

      const data = await response.json();
      console.log('Token exchange successful');
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenType = data.token_type || 'Bearer';
        
        // 토큰을 로컬 스토리지에 저장 (만료 시간 포함)
        const expirationTime = Date.now() + (data.expires_in * 1000);
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_type', this.tokenType);
        localStorage.setItem('spotify_token_expiry', expirationTime.toString());
        
        console.log('Token saved successfully');
        
        return data;
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  // 저장된 토큰 로드 및 만료 확인
  loadStoredToken() {
    const token = localStorage.getItem('spotify_access_token');
    const tokenType = localStorage.getItem('spotify_token_type');
    const expiry = localStorage.getItem('spotify_token_expiry');

    if (token && expiry) {
      const expirationTime = parseInt(expiry);
      const now = Date.now();
      
      if (now < expirationTime) {
        // 토큰이 아직 유효함
        this.accessToken = token;
        this.tokenType = tokenType || 'Bearer';
        console.log('Valid token loaded from storage');
        return true;
      } else {
        // 토큰 만료됨
        console.log('Token expired, clearing storage');
        this.clearToken();
        return false;
      }
    }
    
    return false;
  }

  // 토큰 클리어
  clearToken() {
    this.accessToken = null;
    this.tokenType = 'Bearer';
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_type');
    localStorage.removeItem('spotify_token_expiry');
    console.log('All tokens cleared');
  }

  // API 요청 헬퍼
  async apiRequest(endpoint, options = {}) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const url = `https://api.spotify.com/v1${endpoint}`;
    const config = {
      headers: {
        'Authorization': `${this.tokenType} ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // 토큰 만료
        this.clearToken();
        throw new Error('Token expired');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // 사용자 프로필 가져오기
  async getUserProfile() {
    return await this.apiRequest('/me');
  }

  // 사용자 플레이리스트 가져오기
  async getUserPlaylists(limit = 20) {
    return await this.apiRequest(`/me/playlists?limit=${limit}`);
  }

  // 플레이리스트 트랙 가져오기
  async getPlaylistTracks(playlistId, limit = 50) {
    return await this.apiRequest(`/playlists/${playlistId}/tracks?limit=${limit}`);
  }

  // 사용자 좋아요 목록 가져오기
  async getUserSavedTracks(limit = 50) {
    return await this.apiRequest(`/me/tracks?limit=${limit}`);
  }

  // 곡 검색
  async searchTracks(query, limit = 20) {
    const encodedQuery = encodeURIComponent(query);
    return await this.apiRequest(`/search?q=${encodedQuery}&type=track&limit=${limit}`);
  }

  // 트랙의 Audio Features 가져오기 (목업 포함)
  async getAudioFeatures(trackId) {
    try {
      // 실제 API 시도
      return await this.apiRequest(`/audio-features/${trackId}`);
    } catch (error) {
      console.warn('Audio Features API failed, using mock data:', error);
      // 403 오류 시 목업 데이터 반환
      return this.generateMockAudioFeatures(trackId);
    }
  }

  // 여러 트랙의 Audio Features 가져오기 (목업 포함)
  async getMultipleAudioFeatures(trackIds) {
    try {
      const ids = trackIds.join(',');
      return await this.apiRequest(`/audio-features?ids=${ids}`);
    } catch (error) {
      console.warn('Multiple Audio Features API failed, using mock data:', error);
      // 403 오류 시 목업 데이터 반환
      return {
        audio_features: trackIds.map(id => this.generateMockAudioFeatures(id))
      };
    }
  }

  // 추천 곡 가져오기 (목업 포함)
  async getRecommendations(options = {}) {
    try {
      const params = new URLSearchParams();
      
      // 시드 설정
      if (options.seed_tracks) params.append('seed_tracks', options.seed_tracks.join(','));
      if (options.seed_artists) params.append('seed_artists', options.seed_artists.join(','));
      if (options.seed_genres) params.append('seed_genres', options.seed_genres.join(','));
      
      // Audio Feature 타겟
      if (options.target_energy !== undefined) params.append('target_energy', options.target_energy);
      if (options.target_valence !== undefined) params.append('target_valence', options.target_valence);
      if (options.target_tempo !== undefined) params.append('target_tempo', options.target_tempo);
      if (options.target_danceability !== undefined) params.append('target_danceability', options.target_danceability);
      
      // 범위 설정
      if (options.min_energy !== undefined) params.append('min_energy', options.min_energy);
      if (options.max_energy !== undefined) params.append('max_energy', options.max_energy);
      if (options.min_valence !== undefined) params.append('min_valence', options.min_valence);
      if (options.max_valence !== undefined) params.append('max_valence', options.max_valence);
      
      // 개수
      params.append('limit', options.limit || 20);
      
      return await this.apiRequest(`/recommendations?${params.toString()}`);
    } catch (error) {
      console.warn('Recommendations API failed, this feature requires Premium access');
      throw new Error('Recommendations API requires Premium access or additional permissions');
    }
  }

  // 좋아요 추가
  async addToSavedTracks(trackIds) {
    return await this.apiRequest('/me/tracks', {
      method: 'PUT',
      body: JSON.stringify({ ids: trackIds })
    });
  }

  // 플레이리스트 생성
  async createPlaylist(userId, name, description = '') {
    return await this.apiRequest(`/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name: name,
        description: description,
        public: false
      })
    });
  }

  // 플레이리스트에 곡 추가
  async addTracksToPlaylist(playlistId, trackUris) {
    return await this.apiRequest(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: trackUris })
    });
  }
}

// 싱글톤 인스턴스 생성
const spotifyAPI = new SpotifyAPI();

export default spotifyAPI;