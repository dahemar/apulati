import React from 'react';
import { MEDIA_PATHS_RAW } from '../config/constants';

const DataDebug = () => {
  // Transform raw media paths into works data (same as App.jsx)
  const theatreWorks = [
    {
      id: 1,
      title: 'Concours de Larmes',
      ...MEDIA_PATHS_RAW.CONCOURS_DE_LARMES
    },
    {
      id: 2,
      title: 'Qui à Peur',
      ...MEDIA_PATHS_RAW.QUI_A_PEUR
    }
  ];

  // Transform works data to include scenes (same as TheatreWorks.jsx)
  const transformedWorks = theatreWorks.map(work => ({
    ...work,
    scenes: work.gifs ? work.gifs.map((gif, index) => ({
      video: gif,
      webm: work.webm ? work.webm[index] : null,
      ogv: work.ogv ? work.ogv[index] : null,
      safari: work.safari ? work.safari[index] : null,
      audio: work.audio ? work.audio[index] : null
    })) : []
  }));

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', color: 'white', fontFamily: 'monospace' }}>
      <h1>🔍 Data Debug</h1>
      
      <h2>📊 Raw MEDIA_PATHS_RAW</h2>
      <pre style={{ background: '#333', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(MEDIA_PATHS_RAW, null, 2)}
      </pre>
      
      <h2>🎬 Transformed Works</h2>
      <pre style={{ background: '#333', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(transformedWorks, null, 2)}
      </pre>
      
      <h2>🎬 Scene Sources for Qui à Peur</h2>
      {transformedWorks[1]?.scenes?.map((scene, index) => (
        <div key={index} style={{ margin: '10px 0', padding: '10px', background: '#333' }}>
          <h3>Scene {index}:</h3>
          <ul>
            <li>Video: {scene.video}</li>
            <li>Safari: {scene.safari}</li>
            <li>WebM: {scene.webm}</li>
            <li>OGV: {scene.ogv}</li>
            <li>Audio: {scene.audio}</li>
          </ul>
        </div>
      ))}
      
      <h2>🧪 Test Video Elements</h2>
      {transformedWorks[1]?.scenes?.slice(0, 2).map((scene, index) => (
        <div key={index} style={{ margin: '20px 0' }}>
          <h3>Test Video {index + 1}:</h3>
          <video
            controls
            style={{ width: '300px', height: '200px', background: '#000' }}
            onLoadStart={() => console.log(`Test video ${index} loadstart`)}
            onCanPlay={() => console.log(`Test video ${index} canplay`)}
            onError={(e) => console.error(`Test video ${index} error:`, e.target.error)}
          >
            {scene.webm && <source src={scene.webm} type="video/webm" />}
            {scene.ogv && <source src={scene.ogv} type="video/ogg" />}
            {scene.safari && <source src={scene.safari} type="video/mp4" />}
            <source src={scene.video} type="video/mp4" />
            <p>Your browser does not support the video element.</p>
          </video>
        </div>
      ))}
    </div>
  );
};

export default DataDebug; 