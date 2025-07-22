import React from 'react';
import './LikedSongsSlider.css';

const LikedSongsSlider = ({ 
  value = 0.5, 
  onChange, 
  disabled = false,
  savedTracksCount = 0,
  totalRecommendations = 3
}) => {
  
  const handleSliderChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  const percentage = Math.round(value * 100);
  const likedCount = Math.round(totalRecommendations * value);
  const newCount = totalRecommendations - likedCount;

  return (
    <div className="liked-songs-slider">
      <div className="slider-header">
        <h4>🎯 추천 범위 설정</h4>
        <p>좋아요 곡과 새로운 곡의 비율을 조정하세요</p>
      </div>
      
      <div className="slider-container">
        <div className="slider-labels">
          <span className="label-left">새로운 곡</span>
          <span className="label-right">좋아요 곡</span>
        </div>
        
        <div className="slider-wrapper">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={value}
            onChange={handleSliderChange}
            disabled={disabled}
            className={`slider ${disabled ? 'disabled' : ''}`}
          />
          <div 
            className="slider-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        <div className="slider-value">
          <span className="percentage-text">
            좋아요 곡 비율: <strong>{percentage}%</strong>
          </span>
        </div>
      </div>
      
      <div className="recommendation-preview">
        <div className="preview-info">
          <div className="info-row">
            <span className="info-label">다음 추천에서:</span>
          </div>
          <div className="info-breakdown">
            <div className="breakdown-item new-songs">
              <span className="breakdown-icon">🆕</span>
              <span className="breakdown-text">
                새로운 곡 <strong>{newCount}개</strong>
              </span>
            </div>
            <div className="breakdown-item liked-songs">
              <span className="breakdown-icon">❤️</span>
              <span className="breakdown-text">
                좋아요 곡 <strong>{likedCount}개</strong>
              </span>
            </div>
          </div>
        </div>
        
        {savedTracksCount > 0 && (
          <div className="saved-tracks-info">
            <p>
              💾 보유한 좋아요 곡: <strong>{savedTracksCount.toLocaleString()}개</strong>
            </p>
          </div>
        )}
      </div>
      
      <div className="slider-presets">
        <button 
          className={`preset-button ${value === 0 ? 'active' : ''}`}
          onClick={() => onChange(0)}
          disabled={disabled}
        >
          새곡만
        </button>
        <button 
          className={`preset-button ${value === 0.5 ? 'active' : ''}`}
          onClick={() => onChange(0.5)}
          disabled={disabled}
        >
          섞어서
        </button>
        <button 
          className={`preset-button ${value === 1 ? 'active' : ''}`}
          onClick={() => onChange(1)}
          disabled={disabled}
        >
          좋아요만
        </button>
      </div>
    </div>
  );
};

export default LikedSongsSlider;