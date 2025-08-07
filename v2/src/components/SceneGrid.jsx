import React, { useState, useEffect, useRef } from 'react';
import './SceneGrid.css';

const SceneGrid = ({ work, currentSceneIndex, onSceneChange, isPlaying, onPlayPause, allWorks, currentWorkIndex, onWorkChange, audioRef }) => {
  console.log('🎬 SceneGrid render - currentWorkIndex:', currentWorkIndex, 'currentSceneIndex:', currentSceneIndex, 'isPlaying:', isPlaying);
  
  const [hoveredScene, setHoveredScene] = useState(null);
  const [hoveredWork, setHoveredWork] = useState(null);
  const [actualAudioState, setActualAudioState] = useState(false);
  const containerRef = useRef(null);
  const isMountedRef = useRef(true);
  const audioOperationInProgressRef = useRef(false);
  const lastAudioSrcRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe state updates
  const safeSetState = (setter, value) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  // Check actual audio state
  const getActualAudioState = () => {
    const audio = audioRef?.current;
    if (!audio) return false;
    
    return !audio.paused && !audio.ended && audio.currentTime > 0 && audio.readyState >= 2;
  };

  // Sync React state with actual audio state
  const syncAudioState = () => {
    const actualState = getActualAudioState();
    if (actualState !== actualAudioState) {
      console.log('🔄 Syncing audio state - actual:', actualState, 'react:', actualAudioState);
      safeSetState(setActualAudioState, actualState);
    }
  };

  // Pausar todos los videos
  const pauseAllVideos = () => {
    console.log('⏸️ Pausing all videos');
    const allVideos = document.querySelectorAll('.scene-item video');
    
    allVideos.forEach((video, index) => {
      if (!video.paused) {
        console.log(`  Pausing video ${index}`);
        video.pause();
      }
    });
  };

  // Reproducir el video activo
  const playActiveVideo = () => {
    if (currentSceneIndex !== null) {
      console.log('▶️ Playing active video: found for scene:', currentSceneIndex);
      const activeVideo = document.querySelector(`[data-scene-index="${currentWorkIndex}-${currentSceneIndex}"] video`);
      
      if (activeVideo) {
        if (activeVideo.readyState >= 2) {
          activeVideo.play().catch(error => {
            console.error('🎵 Video play error:', error);
          });
        } else {
          // Wait for video to be ready
          const handleCanPlay = () => {
            activeVideo.play().catch(error => {
              console.error('🎵 Video play error after canplay:', error);
            });
            activeVideo.removeEventListener('canplay', handleCanPlay);
          };
          activeVideo.addEventListener('canplay', handleCanPlay);
        }
      }
    }
  };

  // Play audio - IMPROVED with better error handling and state sync
  const playAudio = async () => {
    if (audioOperationInProgressRef.current) {
      console.log('🎵 Audio operation already in progress, skipping');
      return;
    }

    const audio = audioRef?.current;
    if (!audio || !audio.src) {
      console.log('🎵 No audio element or source available');
      return;
    }

    console.log('🎵 Playing audio, src:', audio.src, 'paused:', audio.paused, 'readyState:', audio.readyState);
    
    audioOperationInProgressRef.current = true;
    
    try {
      // Resume AudioContext if needed
      if (window.GLOBAL_AUDIO_CONTEXT && window.GLOBAL_AUDIO_CONTEXT.state === 'suspended') {
        await window.GLOBAL_AUDIO_CONTEXT.resume();
        console.log('🎵 AudioContext resumed');
      }
      
      if (audio.readyState >= 2) {
        await audio.play();
        console.log('✅ Audio play started successfully, currentTime:', audio.currentTime);
        syncAudioState();
      } else {
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            audio.play().then(() => {
              console.log('✅ Audio play started after waiting, currentTime:', audio.currentTime);
              syncAudioState();
              resolve();
            }).catch(reject);
            audio.removeEventListener('canplay', handleCanPlay);
          };
          audio.addEventListener('canplay', handleCanPlay);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            audio.removeEventListener('canplay', handleCanPlay);
            reject(new Error('Audio ready timeout'));
          }, 5000);
        });
      }
    } catch (error) {
      console.error('🎵 Audio play error:', error);
      // If play fails, sync state to reflect actual state
      syncAudioState();
    } finally {
      audioOperationInProgressRef.current = false;
    }
  };

  // Pause audio - IMPROVED
  const pauseAudio = async () => {
    if (audioOperationInProgressRef.current) {
      console.log('🎵 Audio operation already in progress, skipping pause');
      return;
    }

    const audio = audioRef?.current;
    if (!audio) return;

    console.log('🎵 Pausing audio, currently playing:', !audio.paused);
    
    if (!audio.paused) {
      audioOperationInProgressRef.current = true;
      try {
        audio.pause();
        console.log('✅ Audio paused successfully');
        syncAudioState();
      } catch (error) {
        console.error('🎵 Audio pause error:', error);
      } finally {
        audioOperationInProgressRef.current = false;
      }
    }
  };

  // Handle scene click - IMPROVED with better timing and state sync
  const handleSceneClick = async (sceneIndex, workIndex) => {
    console.log('🖱️ Scene clicked - sceneIndex:', sceneIndex, 'workIndex:', workIndex, 'currentWorkIndex:', currentWorkIndex, 'currentSceneIndex:', currentSceneIndex);
    
    if (workIndex !== currentWorkIndex) {
      // Changing work
      console.log('🔄 Changing work');
      pauseAllVideos();
      await pauseAudio();
      onWorkChange(workIndex);
    } else if (sceneIndex === currentSceneIndex) {
      // Toggle play/pause for same scene
      console.log('⏯️ Toggling play/pause for same scene');
      
      const actualState = getActualAudioState();
      console.log('🎵 Actual audio state:', actualState, 'React state:', isPlaying);
      
      if (actualState) {
        pauseAllVideos();
        await pauseAudio();
        onPlayPause();
      } else {
        playActiveVideo();
        await playAudio();
        onPlayPause();
      }
    } else {
      // Changing to different scene in same work
      console.log('🎬 Changing to different scene in same work');
      pauseAllVideos();
      await pauseAudio();
      onSceneChange(sceneIndex);
      
      // Start playback for new scene after a longer delay to ensure audio is ready
      setTimeout(async () => {
        console.log('🎬 Starting playback for new scene:', sceneIndex);
        playActiveVideo();
        await playAudio();
        onPlayPause();
      }, 500); // Increased delay
    }
  };

  // Handle wheel event for vertical work navigation
  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      // Vertical scroll - navigate between works
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY;
      const threshold = 50;
      
      if (Math.abs(delta) > threshold) {
        if (delta > 0) {
          // Scroll down - next work
          const nextIndex = (currentWorkIndex + 1) % allWorks.length;
          console.log('📜 Scrolling down to work:', nextIndex);
          onWorkChange(nextIndex);
        } else {
          // Scroll up - previous work
          const prevIndex = currentWorkIndex === 0 ? allWorks.length - 1 : currentWorkIndex - 1;
          console.log('📜 Scrolling up to work:', prevIndex);
          onWorkChange(prevIndex);
        }
      }
    }
    // Horizontal scroll is handled natively by the browser
  };

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      console.log('🎯 Adding wheel event listener to container');
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        console.log('🎯 Removing wheel event listener from container');
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentWorkIndex, allWorks.length]);

  // Sync audio state periodically
  useEffect(() => {
    if (currentSceneIndex !== null) {
      const interval = setInterval(() => {
        syncAudioState();
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentSceneIndex]);

  // Handle play/pause state changes - IMPROVED
  useEffect(() => {
    if (currentSceneIndex !== null) {
      const handleStateChange = async () => {
        const actualState = getActualAudioState();
        
        if (isPlaying && !actualState) {
          // React state says play but audio is not playing
          console.log('🔄 React state says play but audio is not playing, starting playback');
          playActiveVideo();
          await playAudio();
        } else if (!isPlaying && actualState) {
          // React state says pause but audio is playing
          console.log('🔄 React state says pause but audio is playing, pausing');
          pauseAllVideos();
          await pauseAudio();
        }
      };
      
      // Add a small delay to prevent conflicts
      const timeoutId = setTimeout(handleStateChange, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isPlaying]);

  // Get button state based on actual audio state
  const getButtonState = () => {
    const actualState = getActualAudioState();
    return actualState && currentSceneIndex !== null;
  };

  return (
    <div className="scene-grid" ref={containerRef}>
      <div className="works-container">
        {allWorks.map((workItem, workIndex) => {
          const isCurrentWork = workIndex === currentWorkIndex;
          const isNextWork = workIndex === (currentWorkIndex + 1) % allWorks.length;
          const isPrevWork = workIndex === (currentWorkIndex - 1 + allWorks.length) % allWorks.length;
          const shouldShow = isCurrentWork || isNextWork || isPrevWork;
          
          if (!shouldShow) return null;
          
          let positionClass = '';
          if (isCurrentWork) positionClass = 'current-work';
          else if (isNextWork) positionClass = 'next-work';
          else if (isPrevWork) positionClass = 'prev-work';
          
          return (
            <div 
              key={workIndex} 
              className={`work-row ${positionClass}`}
            >
              <div className="scenes-container">
                {workItem.scenes && workItem.scenes.map((scene, sceneIndex) => {
                  const isActive = workIndex === currentWorkIndex && sceneIndex === currentSceneIndex;
                  const isHovered = workIndex === hoveredWork && sceneIndex === hoveredScene;
                  const shouldBlur = !isActive && !isHovered;
                  const isActuallyPlaying = getButtonState();
                  
                  return (
                    <div
                      key={sceneIndex}
                      className={`scene-item ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                      data-scene-index={`${workIndex}-${sceneIndex}`}
                      onClick={() => handleSceneClick(sceneIndex, workIndex)}
                      onMouseEnter={() => {
                        console.log('🖱️ Mouse enter scene:', sceneIndex, 'work:', workIndex);
                        safeSetState(setHoveredScene, sceneIndex);
                        safeSetState(setHoveredWork, workIndex);
                      }}
                      onMouseLeave={() => {
                        console.log('🖱️ Mouse leave scene');
                        safeSetState(setHoveredScene, null);
                        safeSetState(setHoveredWork, null);
                      }}
                    >
                      <video
                        src={scene.video}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="scene-video"
                        style={{
                          filter: shouldBlur ? 'blur(2px)' : 'none'
                        }}
                      />
                      
                      <div 
                        className="play-pause-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleSceneClick(sceneIndex, workIndex);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        role="button"
                        tabIndex={-1}
                      >
                        {isActive && isActuallyPlaying ? (
                          <div className="pause-icon">
                            <div className="pause-bar"></div>
                            <div className="pause-bar"></div>
                          </div>
                        ) : (
                          <div className="play-icon"></div>
                        )}
                      </div>
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
