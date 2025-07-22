import React, { useState, useEffect } from 'react';
import LikedSongsSlider from './recommendation/LikedSongsSlider';
import spotifyAPI from '../utils/spotify';
import '../styles/SeedSelector.css';

const SeedSelector = ({ 
  onSeedSelected, 
  userPlaylists = [],
  savedTracks = [],
  isLoadingUserData = false,
  userProfile,
  likedSongsRatio = 0.5,
  onLikedRatioChange,
  isDevMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'playlists' | 'liked'
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);

  // 검색 실행
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await spotifyAPI.searchTracks(searchQuery, 20);
      setSearchResults(response.tracks.items);
    } catch (error) {
      console.error('Search failed:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 엔터키로 검색
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 플레이리스트 선택
  const handlePlaylistSelect = async (playlist) => {
    setSelectedPlaylist(playlist);
    setIsLoadingPlaylist(true);
    
    try {
      const response = await spotifyAPI.getPlaylistTracks(playlist.id, 50);
      setPlaylistTracks(response.items.filter(item => item.track && item.track.preview_url));
    } catch (error) {
      console.error('Failed to load playlist tracks:', error);
      alert('플레이리스트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  // 트랙 데이터 정규화 함수
  const normalizeTrackData = (track) => {
    // track이 없거나 필수 필드가 없으면 null 반환
    if (!track || !track.id || !track.name) {
      console.error('Invalid track data:', track);
      return null;
    }

    return {
      id: track.id,
      name: track.name,
      artists: track.artists || [{ name: 'Unknown Artist' }],
      album: track.album || { name: 'Unknown Album', images: [] },
      preview_url: track.preview_url || null,
      external_urls: track.external_urls || {},
      uri: track.uri || `spotify:track:${track.id}`
    };
  };

  // 트랙 선택
  const handleSelectTrack = (track) => {
    console.log('Raw track data:', track);
    
    const normalizedTrack = normalizeTrackData(track);
    if (!normalizedTrack) {
      alert('잘못된 트랙 데이터입니다. 다른 곡을 선택해주세요.');
      return;
    }
    
    console.log('Normalized track data:', normalizedTrack);
    onSeedSelected(normalizedTrack);
  };

  // 좋아요 목록에서 트랙 선택
  const handleSavedTrackSelect = (item) => {
    console.log('Saved track item:', item);
    
    // 좋아요 목록의 경우 item.track 구조
    if (item && item.track) {
      handleSelectTrack(item.track);
    } else {
      console.error('Invalid saved track structure:', item);
      alert('잘못된 트랙 데이터입니다. 다른 곡을 선택해주세요.');
    }
  };

  // 플레이리스트 트랙 선택
  const handlePlaylistTrackSelect = (item) => {
    console.log('Playlist track item:', item);
    
    // 플레이리스트의 경우도 item.track 구조
    if (item && item.track) {
      handleSelectTrack(item.track);
    } else {
      console.error('Invalid playlist track structure:', item);
      alert('잘못된 트랙 데이터입니다. 다른 곡을 선택해주세요.');
    }
  };

  return (
    <div className="seed-selector">
      <div className="seed-selector-container">
        {/* 헤더 */}
        <div className="header-section">
          <h1 className="logo">🎵 Beatree MVP</h1>
          <p className="subtitle">음악 탐험을 시작할 곡을 선택하세요</p>
          
          {userProfile && (
            <div className="user-welcome">
              <p>
                안녕하세요, <strong>{userProfile.display_name}</strong>님! 
                {userProfile.product === 'premium' ? ' 🌟' : ' 🎵'}
              </p>
            </div>
          )}
        </div>

        {/* 추천 범위 설정 */}
        <LikedSongsSlider
          value={likedSongsRatio}
          onChange={onLikedRatioChange}
          savedTracksCount={savedTracks.length}
          totalRecommendations={3}
        />

        {/* 탭 네비게이션 */}
        <div className="tabs-container">
          <button 
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 검색
          </button>
          <button 
            className={`tab-button ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            📁 플레이리스트 ({userPlaylists.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => setActiveTab('liked')}
          >
            ❤️ 좋아요 ({savedTracks.length})
          </button>
        </div>

        {/* 검색 탭 */}
        {activeTab === 'search' && (
          <div className="search-section">
            <div className="search-input-container">
              <input
                type="text"
                className="search-input"
                placeholder="곡 제목이나 아티스트명을 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                className="search-button"
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
              >
                {isSearching ? '검색 중...' : '검색'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="results-section">
                <h3>검색 결과</h3>
                <div className="track-list">
                  {searchResults.map((track) => (
                    <TrackItem 
                      key={track.id}
                      track={track}
                      onSelect={handleSelectTrack}
                      showPreview={track.preview_url}
                      isDevMode={isDevMode}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 플레이리스트 탭 */}
        {activeTab === 'playlists' && (
          <div className="playlists-section">
            {isLoadingUserData ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>플레이리스트를 불러오는 중...</p>
              </div>
            ) : selectedPlaylist ? (
              <div className="playlist-tracks">
                <div className="playlist-header">
                  <button 
                    className="back-button"
                    onClick={() => setSelectedPlaylist(null)}
                  >
                    ← 뒤로가기
                  </button>
                  <h3>{selectedPlaylist.name}</h3>
                  <p>{selectedPlaylist.tracks.total}곡</p>
                </div>
                
                {isLoadingPlaylist ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>곡 목록을 불러오는 중...</p>
                  </div>
                ) : (
                  <div className="track-list">
                    {playlistTracks.map((item) => (
                      <TrackItem 
                        key={`${item.track.id}-playlist`}
                        track={item.track}
                        onSelect={handlePlaylistTrackSelect}
                        onSelectItem={() => handlePlaylistTrackSelect(item)}
                        showPreview={item.track.preview_url}
                        isDevMode={isDevMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="playlist-list">
                {userPlaylists.map((playlist) => (
                  <div 
                    key={playlist.id}
                    className="playlist-item"
                    onClick={() => handlePlaylistSelect(playlist)}
                  >
                    {playlist.images && playlist.images[0] && (
                      <img 
                        src={playlist.images[0].url} 
                        alt={playlist.name}
                        className="playlist-image"
                      />
                    )}
                    <div className="playlist-info">
                      <h4>{playlist.name}</h4>
                      <p>{playlist.tracks.total}곡 • {playlist.owner.display_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 좋아요 탭 */}
        {activeTab === 'liked' && (
          <div className="liked-section">
            {isLoadingUserData ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>좋아요 목록을 불러오는 중...</p>
              </div>
            ) : savedTracks.length > 0 ? (
              <div className="track-list">
                {savedTracks.map((item) => (
                  <TrackItem 
                    key={`${item.track.id}-saved`}
                    track={item.track}
                    onSelect={handleSavedTrackSelect}
                    onSelectItem={() => handleSavedTrackSelect(item)}
                    showPreview={item.track.preview_url}
                    isDevMode={isDevMode}
                    showAddedDate={item.added_at}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>좋아요한 곡이 없습니다.</p>
                <p>Spotify에서 곡을 좋아요하고 다시 시도해보세요.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 트랙 아이템 컴포넌트
const TrackItem = ({ track, onSelect, onSelectItem, showPreview, isDevMode, showAddedDate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  const handlePlayPreview = (e) => {
    e.stopPropagation();
    
    if (!showPreview) {
      alert('이 곡은 미리듣기를 지원하지 않습니다.');
      return;
    }

    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const newAudio = new Audio(showPreview);
      newAudio.play();
      setIsPlaying(true);
      setAudio(newAudio);
      
      newAudio.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const handleItemClick = () => {
    console.log('TrackItem clicked:', track);
    
    if (onSelectItem) {
      onSelectItem();
    } else if (onSelect) {
      onSelect(track);
    }
  };

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  const formatAddedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="track-item" onClick={handleItemClick}>
      {track?.album?.images?.[0] && (
        <img 
          src={track.album.images[0].url} 
          alt={track.album.name}
          className="track-image"
        />
      )}
      
      <div className="track-info">
        <h4>{track?.name || 'Unknown Track'}</h4>
        <p>{track?.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist'}</p>
        {track?.album && <p className="album-name">{track.album.name}</p>}
        {showAddedDate && (
          <p className="added-date">추가일: {formatAddedDate(showAddedDate)}</p>
        )}
      </div>
      
      <div className="track-actions">
        {showPreview && (
          <button 
            className={`preview-button ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPreview}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        )}
        
        <button className="select-button">
          선택
        </button>
      </div>
      
      {isDevMode && (
        <div className="track-dev-info">
          <small>ID: {track?.id || 'No ID'}</small>
        </div>
      )}
    </div>
  );
};

export default SeedSelector;