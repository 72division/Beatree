import React from 'react';
import { formatAudioFeatures, calculateFeatureDifference } from '../../utils/audioFeatures';
import './AudioFeatureTable.css';

const AudioFeatureTable = ({ 
  beforeFeatures, 
  afterFeatures, 
  isVisible = true,
  title = "Audio Features 변화"
}) => {
  
  if (!isVisible || !beforeFeatures || !afterFeatures) {
    return null;
  }

  const differences = calculateFeatureDifference(beforeFeatures, afterFeatures);
  
  const featureLabels = {
    energy: 'Energy',
    valence: 'Valence',
    tempo: 'Tempo',
    danceability: 'Danceability',
    acousticness: 'Acousticness',
    loudness: 'Loudness'
  };

  const featureDescriptions = {
    energy: '곡의 강렬함과 활동성',
    valence: '곡의 긍정적 분위기',
    tempo: '곡의 속도 (BPM)',
    danceability: '춤추기 적합한 정도',
    acousticness: '어쿠스틱 악기 비율',
    loudness: '곡의 전반적인 음량'
  };

  return (
    <div className="audio-feature-table">
      <div className="table-header">
        <h4>{title}</h4>
        <p>현재 곡과 추천될 곡의 특성 비교</p>
      </div>
      
      <div className="table-container">
        <table className="feature-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Before</th>
              <th>After</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(differences).map(([feature, data]) => (
              <tr key={feature}>
                <td className="feature-name">
                  <div className="feature-info">
                    <span className="feature-label">
                      {featureLabels[feature] || feature}
                    </span>
                    <span className="feature-description">
                      {featureDescriptions[feature]}
                    </span>
                  </div>
                </td>
                <td className="feature-before">
                  {feature === 'tempo' ? Math.round(data.before) : data.before}
                </td>
                <td className="feature-after">
                  {feature === 'tempo' ? Math.round(data.after) : data.after}
                </td>
                <td className={`feature-change ${data.change > 0 ? 'positive' : data.change < 0 ? 'negative' : 'neutral'}`}>
                  <span className="change-value">
                    {data.changeFormatted}
                  </span>
                  <span className="change-indicator">
                    {data.change > 0 ? '↗️' : data.change < 0 ? '↘️' : '➡️'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color positive"></span>
            <span>증가</span>
          </div>
          <div className="legend-item">
            <span className="legend-color negative"></span>
            <span>감소</span>
          </div>
          <div className="legend-item">
            <span className="legend-color neutral"></span>
            <span>변화없음</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioFeatureTable;