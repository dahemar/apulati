import React from 'react';
import VUMeter from './VUMeter';
import './CreditsPanel.css';

const CreditsPanel = ({ credits, title, isVisible = false, audioRef }) => {
  console.log('📋 CreditsPanel rendered - isVisible:', isVisible, 'work:', title, 'audioRef:', !!audioRef?.current);
  console.log('📋 CreditsPanel: title:', title);
  console.log('📋 CreditsPanel: credits:', credits);
  
  // Prevenir que el scroll del panel afecte al video
  const handleWheel = (e) => {
    e.stopPropagation(); // Evitar que el evento se propague al video-section
  };
  
  if (!isVisible) {
    return null;
  }

  if (!credits) {
    return (
      <div className="credits-panel" onWheel={handleWheel}>
        <div className="credits-content">
          <div className="credit-line">
            <span className="credit-title">{title}</span>
          </div>
          <p className="no-credits">No credits available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="credits-panel" onWheel={handleWheel}>
      <div className="credits-content">
        <div className="credit-line">
          <span className="credit-title">{title}</span>
        </div>
        
        {credits.direction && (
          <div className="credit-line">
            <span className="credit-label">Direction :</span>
            <span className="credit-value">{credits.direction}</span>
          </div>
        )}
        
        {credits.acting && (
          <div className="credit-line">
            <span className="credit-label">Acting/Performance :</span>
            <span className="credit-value">{credits.acting}</span>
          </div>
        )}
        
        {credits.video && (
          <div className="credit-line">
            <span className="credit-label">Video :</span>
            <span className="credit-value">{credits.video}</span>
          </div>
        )}
        
        {credits.light && (
          <div className="credit-line">
            <span className="credit-label">Light :</span>
            <span className="credit-value">{credits.light}</span>
          </div>
        )}
        
        {credits.costumes && (
          <div className="credit-line">
            <span className="credit-label">Costumes :</span>
            <span className="credit-value">{credits.costumes}</span>
          </div>
        )}
        
        {credits.makeup && (
          <div className="credit-line">
            <span className="credit-label">Make-up :</span>
            <span className="credit-value">{credits.makeup}</span>
          </div>
        )}
        
        {credits.videoProduction && (
          <div className="credit-line">
            <span className="credit-label">Video production :</span>
            <span className="credit-value">{credits.videoProduction}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsPanel; 