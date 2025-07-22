import React from 'react';
import './DevModeToggle.css';

const DevModeToggle = ({ isEnabled, onToggle }) => {
  return (
    <div className="dev-mode-toggle">
      <label className="toggle-label">
        <span className="toggle-text">
          🔧 Dev Mode
        </span>
        <div className={`toggle-switch ${isEnabled ? 'enabled' : ''}`}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={onToggle}
            className="toggle-input"
          />
          <div className="toggle-slider">
            <div className="toggle-knob"></div>
          </div>
        </div>
      </label>
      
      {isEnabled && (
        <div className="dev-mode-info">
          <p>🎯 Audio Feature 수치가 표시됩니다</p>
        </div>
      )}
    </div>
  );
};

export default DevModeToggle;