import React, { useEffect, useRef } from 'react';

const SimpleVideoTest = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      console.log('🎬 SimpleVideoTest: Video element created');
      
      const video = videoRef.current;
      
      // Add event listeners
      video.addEventListener('loadstart', () => {
        console.log('🎬 SimpleVideoTest: Load started');
      });
      
      video.addEventListener('canplay', () => {
        console.log('🎬 SimpleVideoTest: Can play ✅');
      });
      
      video.addEventListener('error', (e) => {
        console.error('🎬 SimpleVideoTest: Error ❌', e.target.error);
      });
      
      video.addEventListener('loadedmetadata', () => {
        console.log('🎬 SimpleVideoTest: Metadata loaded');
      });
      
      // Try to get video info after a delay
      setTimeout(() => {
        try {
          console.log('🎬 SimpleVideoTest: Duration =', video.duration);
          console.log('🎬 SimpleVideoTest: CurrentSrc =', video.currentSrc);
          console.log('🎬 SimpleVideoTest: ReadyState =', video.readyState);
          console.log('🎬 SimpleVideoTest: NetworkState =', video.networkState);
        } catch (e) {
          console.error('🎬 SimpleVideoTest: Error getting info', e);
        }
      }, 2000);
    }
  }, []);

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: 'white' }}>
      <h2>🎬 Simple Video Test</h2>
      <p>Testing Safari video compatibility with React</p>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Test 1: Safari Working MP4</h3>
        <video
          ref={videoRef}
          controls
          style={{ width: '300px', height: '200px', background: '#000' }}
        >
          <source src="./assets/videos/safari-working/1.Lamp 1.mp4" type="video/mp4" />
          <p>Your browser does not support the video element.</p>
        </video>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Test 2: Multiple Sources</h3>
        <video
          controls
          style={{ width: '300px', height: '200px', background: '#000' }}
        >
          <source src="./assets/videos/safari-working/1.Lamp 1.mp4" type="video/mp4" />
          <source src="./assets/videos/webm/1.Lamp 1.webm" type="video/webm" />
          <source src="./assets/videos/ogv/1.Lamp 1.ogv" type="video/ogg" />
          <source src="./assets/videos/1.Lamp 1.mp4" type="video/mp4" />
          <p>Your browser does not support the video element.</p>
        </video>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Browser Info</h3>
        <p>User Agent: {navigator.userAgent}</p>
        <p>Platform: {navigator.platform}</p>
        <p>Language: {navigator.language}</p>
      </div>
    </div>
  );
};

export default SimpleVideoTest; 