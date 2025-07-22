import React from 'react';
import { BRANCH_PATTERNS } from '../../utils/audioFeatures';
import './BranchButtons.css';

const BranchButtons = ({ 
  currentTrack, 
  onBranchSelect, 
  isDevMode = false, 
  isLoading = false,
  selectedBranches = [] 
}) => {
  
  // 6개의 다양한 분기 패턴 선택
  const defaultPatterns = ['energy_up', 'relaxed', 'similar', 'heavy', 'emotional', 'wake_up'];
  
  const handleBranchClick = (patternKey) => {
    if (isLoading) return;
    onBranchSelect(patternKey);
  };

  const getFeatureChanges = (patternKey, currentFeatures) => {
    if (!currentFeatures || !isDevMode) return null;
    
    const pattern = BRANCH_PATTERNS[patternKey];
    const changes = {};
    
    Object.entries(pattern.features).forEach(([feature, change]) => {
      const currentValue = currentFeatures[feature] || 0;
      const newValue = currentValue + change;
      changes[feature] = {
        before: currentValue.toFixed(2),
        after: Math.max(0, Math.min(1, newValue)).toFixed(2),
        change: change > 0 ? `+${change}` : `${change}`
      };
    });
    
    return changes;
  };

  return (
    <div className="branch-buttons">
      <div className="branch-buttons-header">
        <h3>🎵 다음 방향을 선택하세요</h3>
        <p>현재 곡의 느낌을 어떻게 변화시킬까요?</p>
      </div>
      
      <div className="buttons-container">
        {defaultPatterns.map((patternKey) => {
          const pattern = BRANCH_PATTERNS[patternKey];
          const featureChanges = getFeatureChanges(patternKey, currentTrack?.audio_features);
          const isSelected = selectedBranches.includes(patternKey);
          
          return (
            <button
              key={patternKey}
              className={`branch-button ${isSelected ? 'selected' : ''} ${isLoading ? 'loading' : ''}`}
              onClick={() => handleBranchClick(patternKey)}
              disabled={isLoading}
            >
              <div className="button-main">
                <span className="button-emoji">{pattern.emoji}</span>
                <div className="button-text">
                  <h4>{pattern.label}</h4>
                  <p>{pattern.description}</p>
                </div>
              </div>
              
              {isDevMode && featureChanges && (
                <div className="dev-features">
                  {Object.entries(featureChanges).slice(0, 3).map(([feature, data]) => (
                    <div key={feature} className="feature-change">
                      <span className="feature-name">{feature}:</span>
                      <span className="feature-values">
                        {data.before}→{data.after}
                      </span>
                      <span className={`feature-delta ${parseFloat(data.change) > 0 ? 'positive' : 'negative'}`}>
                        {data.change}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {isLoading && (
                <div className="button-loading">
                  <div className="loading-spinner-small"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      
      {isLoading && (
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Premium 없이도 작동하는 추천 시스템으로 곡을 찾는 중...</p>
          <small>사용자의 플레이리스트와 좋아요 목록을 활용하여 추천합니다</small>
        </div>
      )}
    </div>
  );
};

export default BranchButtons;