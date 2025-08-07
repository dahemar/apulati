import React from 'react';
import VUMeter from './VUMeter';
import './CreditsPanel.css';

const CreditsPanel = ({ isVisible, title, credits, audioRef }) => {
  console.log('📋 CreditsPanel rendered - isVisible:', isVisible, 'title:', title, 'audioRef:', !!audioRef);

  if (!isVisible) {
    return null;
  }

  const handleWheel = (e) => {
    // Prevent scroll events from propagating to the video section
    e.stopPropagation();
  };

  return (
    <div className="credits-panel visible" onWheel={handleWheel}>
      <div className="credits-content">
        <div className="credit-line">
          <span className="credit-title">{title}</span>
        </div>
        
        {credits && credits.map((credit, index) => (
          <div key={index} className="credit-line">
            <span className="credit-role">{credit.role}:</span>
            <span className="credit-name">{credit.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditsPanel; 