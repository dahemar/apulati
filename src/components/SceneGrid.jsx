import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SceneGrid.css';

const DEBUG = false;

const isSafariBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium');
};

const isFirefoxBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  return /Firefox\//.test(navigator.userAgent);
};

const isChromeBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // Detect Chrome/Chromium but exclude Edge and Opera
  return (ua.includes('Chrome') || ua.includes('Chromium')) && !ua.includes('Edg') && !ua.includes('OPR');
};

const SceneGrid = ({ work, currentSceneIndex, onSceneChange, isPlaying, onPlayPause, allWorks, currentWorkIndex, onWorkChange, audioRef, startPlayback, onStartScenePlayback, stopPlayback }) => {
  const [hoveredScene, setHoveredScene] = useState(null);
  const [hoveredWork, setHoveredWork] = useState(null);
  const containerRef = useRef(null);
  const isChangingSceneRef = useRef(false);
  const lastActiveWorkRef = useRef(null);
  const lastActiveSceneRef = useRef(null);
  const lastWheelTimeRef = useRef(0);

  if (DEBUG) console.log('🎬 SceneGrid render - work:', work?.title, 'currentSceneIndex:', currentSceneIndex, 'isPlaying:', isPlaying);
  
  // Debug: Log scene data with actual values
  if (DEBUG && work?.scenes) {
    console.log('📊 Scene data for', work.title, ':');
    work.scenes.forEach((scene, index) => {
      console.log(`  Scene ${index}:`, {
        video: scene.video,
        safari: scene.safari,
        webm: scene.webm,
        ogv: scene.ogv,
        audio: scene.audio
      });
    });
  }

  const renderSources = (scene) => {
    const inSafari = isSafariBrowser();
    const inFirefox = isFirefoxBrowser();
    const inChrome = isChromeBrowser();

    if (inSafari) {
      return (
        <>
          {scene.safari && <source src={scene.safari} type="video/mp4" />}
          <source src={scene.video} type="video/mp4" />
          {scene.webm && <source src={scene.webm} type="video/webm" />} 
          {scene.ogv && <source src={scene.ogv} type="video/ogg" />}
        </>
      );
    }

    if (inFirefox) {
      return (
        <>
          {scene.webm && <source src={scene.webm} type="video/webm" />}
          {scene.ogv && <source src={scene.ogv} type="video/ogg" />}
          {scene.safari && <source src={scene.safari} type="video/mp4" />}
          <source src={scene.video} type="video/mp4" />
        </>
      );
    }

    if (inChrome) {
      return (
        <>
          <source src={scene.video} type="video/mp4" />
          {scene.webm && <source src={scene.webm} type="video/webm" />}
          {scene.ogv && <source src={scene.ogv} type="video/ogg" />}
          {scene.safari && <source src={scene.safari} type="video/mp4" />}
        </>
      );
    }

    return (
      <>
        {scene.webm && <source src={scene.webm} type="video/webm" />}
        {scene.ogv && <source src={scene.ogv} type="video/ogg" />}
        {scene.safari && <source src={scene.safari} type="video/mp4" />}
        <source src={scene.video} type="video/mp4" />
      </>
    );
  };

  // Pause all videos except the active one
  const pauseAllVideosExcept = (activeSceneIndex, activeWorkIndex) => {
    const allVideos = document.querySelectorAll('.scene-item video');
    if (DEBUG) {
      console.log(`⏸️ Pausing all videos except work:${activeWorkIndex} scene:${activeSceneIndex}`);
      console.log(`📊 Total videos found: ${allVideos.length}`);
    }
    
    allVideos.forEach((video, index) => {
      const sceneItem = video.closest('.scene-item');
      if (!sceneItem) {
        if (DEBUG) console.warn(`⚠️ Video ${index} has no parent scene-item`);
        return;
      }
      
      const sceneIndex = parseInt(sceneItem.getAttribute('data-scene-index'));
      const workIndex = parseInt(sceneItem.getAttribute('data-work-index'));
      
      if (DEBUG) console.log(`  Video ${index}: work:${workIndex} scene:${sceneIndex} - should pause: ${!(workIndex === activeWorkIndex && sceneIndex === activeSceneIndex)}`);
      
      if (!(workIndex === activeWorkIndex && sceneIndex === activeSceneIndex)) {
        if (!video.paused) {
          if (DEBUG) console.log(`⏸️ Pausing video work:${workIndex} scene:${sceneIndex}`);
          video.pause();
        }
      } else {
        if (DEBUG) console.log(`▶️ Keeping video work:${workIndex} scene:${sceneIndex} playing`);
      }
    });
  };

  // Play only the active video
  const playActiveVideo = (activeSceneIndex, activeWorkIndex) => {
    if (activeSceneIndex !== null) {
      const allVideos = document.querySelectorAll('.scene-item video');
      if (DEBUG) {
        console.log(`🎬 playActiveVideo: Pausing ${allVideos.length} videos before playing active one`);
        console.log(`🎬 Looking for active video: work:${activeWorkIndex} scene:${activeSceneIndex}`);
      }
      
      allVideos.forEach((video, index) => {
        const sceneItem = video.closest('.scene-item');
        const sceneIndex = parseInt(sceneItem?.getAttribute('data-scene-index'));
        const workIndex = parseInt(sceneItem?.getAttribute('data-work-index'));
        
        if (DEBUG) console.log(`  Video ${index}: work:${workIndex} scene:${sceneIndex} - isActive: ${workIndex === activeWorkIndex && sceneIndex === activeSceneIndex}`);
        
        if (!(workIndex === activeWorkIndex && sceneIndex === activeSceneIndex)) {
          if (!video.paused) {
            if (DEBUG) console.log(`⏸️ Immediately pausing video ${index} work:${workIndex} scene:${sceneIndex}`);
            video.pause();
          }
        }
      });
      
      setTimeout(() => {
        const activeVideo = document.querySelector(`[data-work-index="${activeWorkIndex}"][data-scene-index="${activeSceneIndex}"] video`);
        if (activeVideo) {
          if (DEBUG) console.log('▶️ Playing active video for work:', activeWorkIndex, 'scene:', activeSceneIndex);
          activeVideo.play().catch(error => {
            console.error('❌ Error playing video:', error);
          });
        } else if (DEBUG) {
          console.warn('⚠️ Active video not found for work:', activeWorkIndex, 'scene:', activeSceneIndex);
        }
      }, 10);
    }
  };

  // Handle wheel event for work navigation (throttled)
  const handleWheel = useCallback((e) => {
    const now = performance.now();
    if (now - lastWheelTimeRef.current < 300) {
      return;
    }
    lastWheelTimeRef.current = now;

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();

      // Stop playback immediately when navigating works
      try {
        // Pause audio
        const audio = document.querySelector('audio');
        if (audio && !audio.paused) audio.pause();
        // Pause all videos
        const allVideos = document.querySelectorAll('.scene-item video');
        allVideos.forEach(v => { if (!v.paused) v.pause(); });
      } catch (_) {}
      
      if (typeof stopPlayback === 'function') {
        stopPlayback();
      } else if (typeof onPlayPause === 'function') {
        // Fallback: toggle play state to false
        if (isPlaying) onPlayPause();
      }

      const delta = e.deltaY;
      
      if (delta > 0 && currentWorkIndex < allWorks.length - 1) {
        if (DEBUG) console.log('🔽 Scrolling to next work');
        onWorkChange(currentWorkIndex + 1);
      } else if (delta < 0 && currentWorkIndex > 0) {
        if (DEBUG) console.log('🔼 Scrolling to previous work');
        onWorkChange(currentWorkIndex - 1);
      }
    }
  }, [currentWorkIndex, allWorks.length, onWorkChange, isPlaying, onPlayPause, stopPlayback]);

  // Add wheel event listener
  useEffect(() => {
    const target = window;
    if (target && typeof target.addEventListener === 'function') {
      target.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        target.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  // Debug: Check if video elements are created in DOM
  useEffect(() => {
    if (!DEBUG) return;
    console.log('🔍 Checking video elements in DOM...');
    const allVideos = document.querySelectorAll('.scene-item video');
    console.log(`📊 Found ${allVideos.length} video elements in DOM`);
    
    allVideos.forEach((video, index) => {
      const sceneItem = video.closest('.scene-item');
      const sceneIndex = parseInt(sceneItem?.getAttribute('data-scene-index'));
      const workIndex = parseInt(sceneItem?.getAttribute('data-work-index'));
      
      console.log(`🎬 Video ${index} in DOM:`, {
        workIndex,
        sceneIndex,
        readyState: video.readyState,
        networkState: video.networkState,
        currentSrc: video.currentSrc,
        sources: Array.from(video.querySelectorAll('source')).map(source => source.src)
      });
    });
  }, [work?.title]);

  // useEffect to handle play/pause state changes
  useEffect(() => {
    if (isChangingSceneRef.current) {
      if (DEBUG) console.log('🎬 useEffect skipped: isChangingSceneRef is true');
      return;
    }

    if (currentSceneIndex === null) {
      if (DEBUG) console.log('🎬 useEffect skipped: currentSceneIndex is null');
      return;
    }

    if (DEBUG) console.log('🎬 useEffect triggered - isPlaying:', isPlaying, 'work:', currentWorkIndex, 'scene:', currentSceneIndex);

    if (isPlaying) {
      if (DEBUG) console.log('🎬 Starting playback - work:', currentWorkIndex, 'scene:', currentSceneIndex);
      pauseAllVideosExcept(currentSceneIndex, currentWorkIndex);
      setTimeout(() => {
        playActiveVideo(currentSceneIndex, currentWorkIndex);
      }, 10);
    } else {
      if (DEBUG) console.log('🎬 Stopping playback - pausing all videos');
      pauseAllVideosExcept(null, null);
    }
  }, [isPlaying, currentSceneIndex, currentWorkIndex]);

  // Handle scene click
  const handleSceneClick = useCallback((sceneIndex, workIndex) => {
    if (DEBUG) console.log('🖱️ Scene clicked - sceneIndex:', sceneIndex, 'workIndex:', workIndex, 'currentWorkIndex:', currentWorkIndex, 'currentSceneIndex:', currentSceneIndex);

    pauseAllVideosExcept(null, null);

    const switchingWork = workIndex !== currentWorkIndex;
    const sameScene = !switchingWork && sceneIndex === currentSceneIndex;

    if (sameScene && isPlaying) {
      if (DEBUG) console.log('⏯️ Toggling play/pause for same scene');
      onPlayPause();
      return;
    }

    if (sameScene && !isPlaying) {
      if (DEBUG) console.log('▶️ Resuming same scene without resetting sources');
      onPlayPause();
      return;
    }

    if (DEBUG) console.log('🎬 Changing scene/work and starting playback');

    if (typeof onStartScenePlayback === 'function') {
      onStartScenePlayback(sceneIndex, workIndex);
      return;
    }

    isChangingSceneRef.current = true;
    if (switchingWork) {
      onWorkChange(workIndex);
    }
    onSceneChange(sceneIndex);
    setTimeout(() => {
      isChangingSceneRef.current = false;
      if (isPlaying) {
        playActiveVideo(sceneIndex, workIndex);
      } else if (typeof startPlayback === 'function') {
        startPlayback();
      } else {
        onPlayPause();
      }
    }, 50);
  }, [currentSceneIndex, currentWorkIndex, isPlaying, onPlayPause, onStartScenePlayback, onWorkChange, onSceneChange, startPlayback]);

  // Calculate position classes for three-row layout
  const getPositionClass = (workIndex) => {
    if (workIndex === currentWorkIndex) return 'current-work';
    if (workIndex === currentWorkIndex + 1) return 'next-work';
    if (workIndex === currentWorkIndex - 1) return 'prev-work';
    return 'hidden-work';
  };

  const inSafari = isSafariBrowser();

  return (
    <div className="scene-grid" ref={containerRef}>
      <div className="works-container">
        {allWorks.map((workItem, workIndex) => {
          const positionClass = getPositionClass(workIndex);
          
          return (
            <div key={workIndex} className={`work-row ${positionClass}`}>
              <div className="scenes-container">
                {workItem.scenes && workItem.scenes.map((scene, sceneIndex) => {
                  const isActive = workIndex === currentWorkIndex && sceneIndex === currentSceneIndex;
                  const isHovered = workIndex === hoveredWork && sceneIndex === hoveredScene;
                  const shouldBlur = !isActive && !isHovered;

                  const filterValue = shouldBlur && !inSafari ? 'blur(2px)' : 'none';
                  const opacityValue = shouldBlur && inSafari ? 0.85 : 1;
                  
                  if (DEBUG) console.log(`🎬 Scene ${sceneIndex} sources:`, { video: scene.video, safari: scene.safari, webm: scene.webm, ogv: scene.ogv });
                  
                  return (
                    <div
                      key={sceneIndex}
                      className={`scene-item ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                      data-scene-index={sceneIndex}
                      data-work-index={workIndex}
                      onClick={() => handleSceneClick(sceneIndex, workIndex)}
                      onMouseEnter={() => {
                        setHoveredScene(sceneIndex);
                        setHoveredWork(workIndex);
                      }}
                      onMouseLeave={() => {
                        setHoveredScene(null);
                        setHoveredWork(null);
                      }}
                    >
                      <video
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="scene-video"
                        style={{
                          filter: filterValue,
                          opacity: opacityValue
                        }}
                        onLoadStart={() => {
                          if (DEBUG) console.log(`🎬 Video ${sceneIndex} loadstart - sources:`, { webm: scene.webm, ogv: scene.ogv, safari: scene.safari, video: scene.video });
                        }}
                        onCanPlay={() => {
                          if (DEBUG) console.log(`🎬 Video ${sceneIndex} canplay - currentSrc:`, document.querySelector(`[data-work-index="${workIndex}"][data-scene-index="${sceneIndex}"] video`)?.currentSrc);
                        }}
                        onError={(e) => {
                          console.error(`🎬 Video ${sceneIndex} error:`, e.target.error);
                          console.error(`🎬 Video ${sceneIndex} error details:`, { code: e.target.error?.code, message: e.target.error?.message, currentSrc: e.target.currentSrc });
                        }}
                        onLoadedMetadata={(e) => {
                          const el = e.currentTarget;
                          try {
                            if (el && el.readyState >= 1) {
                              const originalTime = el.currentTime;
                              el.currentTime = Math.min(0.01, el.duration || 0.01);
                              el.pause();
                              el.currentTime = originalTime;
                            }
                          } catch (err) {
                            if (DEBUG) console.warn('⚠️ onLoadedMetadata seek workaround failed:', err);
                          }
                          if (DEBUG) console.log(`🎬 Video ${sceneIndex} loadedmetadata - duration:`, document.querySelector(`[data-work-index="${workIndex}"][data-scene-index="${sceneIndex}"] video`)?.duration);
                        }}
                        onLoadedData={() => {
                          if (DEBUG) console.log(`🎬 Video ${sceneIndex} loadeddata`);
                        }}
                      >
                        {renderSources(scene)}
                        <p>Tu navegador no soporta el elemento de video.</p>
                      </video>
                      
                      <button 
                        className="play-pause-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSceneClick(sceneIndex, workIndex);
                        }}
                      >
                        {isActive && isPlaying ? '⏸' : '▶'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SceneGrid; 