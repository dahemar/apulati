import React, { useState, useEffect, useRef } from 'react';
import './SceneGrid.css';

const SceneGrid = ({ work, currentSceneIndex, onSceneChange, isPlaying, onPlayPause, allWorks, currentWorkIndex, onWorkChange, audioRef }) => {
  const [hoveredScene, setHoveredScene] = useState(null);
  const [hoveredWork, setHoveredWork] = useState(null);
  const containerRef = useRef(null);
  const isChangingSceneRef = useRef(false);
  const lastActiveWorkRef = useRef(null);
  const lastActiveSceneRef = useRef(null);

  console.log('🎬 SceneGrid render - work:', work?.title, 'currentSceneIndex:', currentSceneIndex, 'isPlaying:', isPlaying);

  // Pause all videos except the active one
  const pauseAllVideosExcept = (activeSceneIndex, activeWorkIndex) => {
    const allVideos = document.querySelectorAll('.scene-item video');
    console.log(`⏸️ Pausing all videos except work:${activeWorkIndex} scene:${activeSceneIndex}`);
    console.log(`📊 Total videos found: ${allVideos.length}`);
    
    allVideos.forEach((video, index) => {
      const sceneItem = video.closest('.scene-item');
      if (!sceneItem) {
        console.warn(`⚠️ Video ${index} has no parent scene-item`);
        return;
      }
      
      const sceneIndex = parseInt(sceneItem.getAttribute('data-scene-index'));
      const workIndex = parseInt(sceneItem.getAttribute('data-work-index'));
      
      console.log(`  Video ${index}: work:${workIndex} scene:${sceneIndex} - should pause: ${!(workIndex === activeWorkIndex && sceneIndex === activeSceneIndex)}`);
      
      // Only pause if it's not the active video (both work AND scene must match)
      if (!(workIndex === activeWorkIndex && sceneIndex === activeSceneIndex)) {
        if (!video.paused) {
          console.log(`⏸️ Pausing video work:${workIndex} scene:${sceneIndex}`);
          video.pause();
        }
      } else {
        console.log(`▶️ Keeping video work:${workIndex} scene:${sceneIndex} playing`);
      }
    });
  };

  // Play only the active video
  const playActiveVideo = (activeSceneIndex, activeWorkIndex) => {
    if (activeSceneIndex !== null) {
      // First, pause ALL videos immediately and synchronously
      const allVideos = document.querySelectorAll('.scene-item video');
      console.log(`🎬 playActiveVideo: Pausing ${allVideos.length} videos before playing active one`);
      console.log(`🎬 Looking for active video: work:${activeWorkIndex} scene:${activeSceneIndex}`);
      
      allVideos.forEach((video, index) => {
        const sceneItem = video.closest('.scene-item');
        const sceneIndex = parseInt(sceneItem?.getAttribute('data-scene-index'));
        const workIndex = parseInt(sceneItem?.getAttribute('data-work-index'));
        
        console.log(`  Video ${index}: work:${workIndex} scene:${sceneIndex} - isActive: ${workIndex === activeWorkIndex && sceneIndex === activeSceneIndex}`);
        
        // Only pause videos that are not the active one
        if (!(workIndex === activeWorkIndex && sceneIndex === activeSceneIndex)) {
          if (!video.paused) {
            console.log(`⏸️ Immediately pausing video ${index} work:${workIndex} scene:${sceneIndex}`);
            video.pause();
          }
        } else {
          console.log(`▶️ Keeping video ${index} work:${workIndex} scene:${sceneIndex} for active playback`);
        }
      });
      
      // Small delay to ensure all videos are paused
      setTimeout(() => {
        // Then play only the active video
        const activeVideo = document.querySelector(`[data-work-index="${activeWorkIndex}"][data-scene-index="${activeSceneIndex}"] video`);
        if (activeVideo) {
          console.log('▶️ Playing active video for work:', activeWorkIndex, 'scene:', activeSceneIndex);
          activeVideo.play().catch(error => {
            console.error('❌ Error playing video:', error);
          });
        } else {
          console.warn('⚠️ Active video not found for work:', activeWorkIndex, 'scene:', activeSceneIndex);
          // Log all available videos for debugging
          const allVideos = document.querySelectorAll('.scene-item video');
          allVideos.forEach((video, index) => {
            const sceneItem = video.closest('.scene-item');
            const sceneIndex = parseInt(sceneItem?.getAttribute('data-scene-index'));
            const workIndex = parseInt(sceneItem?.getAttribute('data-work-index'));
            console.log(`  Available video ${index}: work:${workIndex} scene:${sceneIndex}`);
          });
        }
      }, 10); // Very short delay to ensure pause operations complete
    }
  };

  // Handle wheel event for work navigation
  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      const delta = e.deltaY;
      
      if (delta > 0 && currentWorkIndex < allWorks.length - 1) {
        console.log('🔽 Scrolling to next work');
        onWorkChange(currentWorkIndex + 1);
      } else if (delta < 0 && currentWorkIndex > 0) {
        console.log('🔼 Scrolling to previous work');
        onWorkChange(currentWorkIndex - 1);
      }
    }
  };

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentWorkIndex, allWorks.length]);

  // useEffect to handle play/pause state changes
  useEffect(() => {
    if (isChangingSceneRef.current) {
      console.log('🎬 useEffect skipped: isChangingSceneRef is true');
      return;
    }

    // Only proceed if we have a valid scene selected
    if (currentSceneIndex === null) {
      console.log('🎬 useEffect skipped: currentSceneIndex is null');
      return;
    }

    console.log('🎬 useEffect triggered - isPlaying:', isPlaying, 'work:', currentWorkIndex, 'scene:', currentSceneIndex);

    if (isPlaying) {
      console.log('🎬 Starting playback - work:', currentWorkIndex, 'scene:', currentSceneIndex);
      // Pause all videos except the active one
      pauseAllVideosExcept(currentSceneIndex, currentWorkIndex);

      // Small delay to ensure all videos are paused, then play active video
      setTimeout(() => {
        playActiveVideo(currentSceneIndex, currentWorkIndex);
      }, 10);
    } else {
      console.log('🎬 Stopping playback - pausing all videos');
      // Pause all videos
      pauseAllVideosExcept(null, null);
    }
  }, [isPlaying, currentSceneIndex, currentWorkIndex]);

  // Handle scene click
  const handleSceneClick = (sceneIndex, workIndex) => {
    console.log('🖱️ Scene clicked - sceneIndex:', sceneIndex, 'workIndex:', workIndex, 'currentWorkIndex:', currentWorkIndex, 'currentSceneIndex:', currentSceneIndex);

    // Pause all videos immediately when any scene is clicked
    pauseAllVideosExcept(null, null); // Pause all videos

    if (sceneIndex === currentSceneIndex && workIndex === currentWorkIndex && isPlaying) {
      // Same scene clicked while playing, toggle play/pause
      console.log('⏯️ Toggling play/pause for same scene');
      onPlayPause(); // Toggle the global isPlaying state
    } else {
      // Different scene or work - change to it and start playback
      console.log('🎬 Changing scene/work and starting playback');
      
      // Set a brief flag to prevent useEffect interference during the change
      isChangingSceneRef.current = true;
      
      if (workIndex !== currentWorkIndex) {
        onWorkChange(workIndex);
      }
      onSceneChange(sceneIndex);
      
      // Start playback after a brief delay to let state changes propagate
      setTimeout(() => {
        isChangingSceneRef.current = false;
        if (!isPlaying) {
          onPlayPause(); // Start playback
        }
      }, 100);
    }
  };

  // Calculate position classes for three-row layout
  const getPositionClass = (workIndex) => {
    if (workIndex === currentWorkIndex) return 'current-work';
    if (workIndex === currentWorkIndex + 1) return 'next-work';
    if (workIndex === currentWorkIndex - 1) return 'prev-work';
    return 'hidden-work';
  };

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
                        preload="metadata"
                        className="scene-video"
                        style={{
                          filter: shouldBlur ? 'blur(2px)' : 'none'
                        }}
                      >
                        {/* Primary MP4 source - always available */}
                        <source src={scene.video} type="video/mp4" />
                        {/* Additional formats - only if they exist */}
                        {scene.webm && <source src={scene.webm} type="video/webm; codecs='vp8, vorbis'" />}
                        {scene.ogv && <source src={scene.ogv} type="video/ogg; codecs='theora, vorbis'" />}
                        {/* Fallback message */}
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