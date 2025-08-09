import React, { useState, useEffect, useRef, useMemo } from 'react';
import LazyImage from '../components/LazyImage';
import CreditsPanel from '../components/CreditsPanel';
import SceneGrid from '../components/SceneGrid';
import VUMeter from '../components/VUMeter';
import logger from '../utils/logger';
import { MESSAGES } from '../config/constants';
import './TheatreWorks.css';

const TheatreWorks = ({ works = [] }) => {
  const [currentWorkIndex, setCurrentWorkIndex] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  const audioRef = useRef(null);
  const videoSectionRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastAudioSrcRef = useRef(null);
  const audioOperationInProgressRef = useRef(false);
  const audioStateSyncRef = useRef(false);

  // Transform works data to include scenes - MEMOIZED with stable dependency
  const transformedWorks = useMemo(() => {
    if (!works || works.length === 0) return [];
    
    console.log('🔄 Transforming works data (once)...');
    return works.map(work => ({
      ...work,
      scenes: work.gifs ? work.gifs.map((gif, index) => ({
        video: gif,
        webm: work.webm ? work.webm[index] : null,
        ogv: work.ogv ? work.ogv[index] : null,
        safari: work.safari ? work.safari[index] : null,
        audio: work.audio ? work.audio[index] : null
      })) : []
    }));
  }, [works.length]); // Only depend on length, not the entire works array

  // Cleanup function to mark component as unmounted
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Function to safely update state only if component is still mounted
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

  // Sync audio state with React state
  const syncAudioState = () => {
    const actualState = getActualAudioState();
    if (actualState !== isPlaying && !audioStateSyncRef.current) {
      console.log('🔄 TheatreWorks: Syncing audio state - actual:', actualState, 'react:', isPlaying);
      audioStateSyncRef.current = true;
      safeSetState(setIsPlaying, actualState);
    setTimeout(() => {
        audioStateSyncRef.current = false;
      }, 100);
    }
  };

  // Función para verificar si un archivo de audio existe
  const checkAudioFileExists = async (audioSrc) => {
    try {
      const response = await fetch(audioSrc, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('🎵 Error checking audio file:', error);
      return false;
      }
  };
  
  // Verificar que works existe y tiene elementos
  if (!works || works.length === 0) {
    return (
      <div className="theatre-works">
        <div className="work-container">
          <div className="work-header">
            <h1 className="work-title">No works available</h1>
          </div>
        </div>
      </div>
    );
  }
  
  const currentWork = transformedWorks[currentWorkIndex];
    
  // Handle scene changes
  const handleSceneChange = (sceneIndex) => {
    console.log('🎬 Scene change requested:', sceneIndex, 'current:', currentSceneIndex);
    safeSetState(setCurrentSceneIndex, sceneIndex);
    safeSetState(setHasUserInteracted, true);
  };

  // Handle play/pause - IMPROVED with state sync
  const handlePlayClick = async () => {
    if (audioOperationInProgressRef.current) {
      console.log('🎵 Audio operation in progress, skipping play/pause toggle');
      return;
    }

    console.log('⏯️ Play/Pause requested, current state:', isPlaying);
    
    audioOperationInProgressRef.current = true;
    try {
      const actualState = getActualAudioState();
      console.log('🎵 Actual audio state:', actualState, 'React state:', isPlaying);
      
      // Toggle based on actual state, not React state
      safeSetState(setIsPlaying, !actualState);
    } finally {
      audioOperationInProgressRef.current = false;
    }
  };

  // Set audio source when scene changes - IMPROVED
  useEffect(() => {
    if (currentSceneIndex !== null && currentWork?.scenes?.[currentSceneIndex]) {
      const scene = currentWork.scenes[currentSceneIndex];
      const audioSrc = scene.audio;
      
      if (audioSrc && audioRef.current) {
        // Only change audio source if it's actually different
        if (lastAudioSrcRef.current !== audioSrc) {
          console.log(`🎵 Scene changed - Setting NEW audio source: ${audioSrc} work: ${currentWork.title} scene: ${currentSceneIndex}`);
          
          // Pause current audio before changing source
          if (!audioRef.current.paused) {
            audioRef.current.pause();
          }
          
          // Check if audio file exists before setting source
          checkAudioFileExists(audioSrc).then(exists => {
            if (exists && audioRef.current && isMountedRef.current) {
              console.log('✅ Audio file exists, setting source for work:', currentWork.title);
              
              // Set source and load
              audioRef.current.src = audioSrc;
      audioRef.current.load();
              lastAudioSrcRef.current = audioSrc;
              console.log('🎵 Audio load() called for new source');
              
              // Reset play state when changing audio source
              safeSetState(setIsPlaying, false);
            } else if (!exists) {
              console.warn('❌ Audio file not found:', audioSrc);
            }
          });
        } else {
          console.log('🎵 Audio source unchanged, skipping reload:', audioSrc);
        }
      } else {
        console.warn('⚠️ No current scene selected or scenes not available, work:', currentWork.title);
      }
    }
  }, [currentSceneIndex, currentWork?.title]); // Only depend on scene index and work title

  // Sync audio state periodically
  useEffect(() => {
    if (currentSceneIndex !== null) {
      const interval = setInterval(() => {
        syncAudioState();
      }, 2000); // Check every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [currentSceneIndex]);

  // Manejar navegación entre works (vertical scroll)
  const handleWheel = (e) => {
    // This is now handled by SceneGrid for vertical navigation between works
    // and horizontal navigation is handled natively by the browser
  };

  return (
    <div className="theatre-works">
      <div className="fixed-viewer">
        <div className={`viewer-container ${hasUserInteracted ? 'credits-visible' : ''}`}>
          <div className={`video-section ${!hasUserInteracted ? 'full-width' : ''}`} ref={videoSectionRef}>
            <SceneGrid
              work={currentWork}
              currentSceneIndex={currentSceneIndex}
              onSceneChange={handleSceneChange}
              isPlaying={isPlaying}
              onPlayPause={handlePlayClick}
              allWorks={transformedWorks}
              currentWorkIndex={currentWorkIndex}
              onWorkChange={(newWorkIndex) => {
                console.log('🔄 Work change requested:', newWorkIndex, 'from:', currentWorkIndex);
                
                // Pause and reset audio when changing works
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                  lastAudioSrcRef.current = null; // Reset to force reload for new work
                }
                
                safeSetState(setCurrentWorkIndex, newWorkIndex);
                safeSetState(setCurrentSceneIndex, null);
                safeSetState(setIsPlaying, false);
                safeSetState(setHasUserInteracted, false);
              }}
              audioRef={audioRef}
              creditsVisible={hasUserInteracted}
            />
          </div>

          <CreditsPanel 
            title={currentWork.title}
            credits={currentWork.credits}
            isVisible={hasUserInteracted}
            audioRef={audioRef}
          />
          
          {hasUserInteracted && (
            <VUMeter audioRef={audioRef} />
          )}
        </div>
        </div>

        <audio
          ref={audioRef}
          loop
          preload="auto"
        onLoadStart={() => console.log('🎵 Audio loadstart')}
        onCanPlay={() => console.log('🎵 Audio canplay')}
        onCanPlayThrough={() => console.log('🎵 Audio canplaythrough')}
        onPlay={() => {
          console.log('🎵 Audio play event fired');
          syncAudioState();
        }}
        onPause={() => {
          console.log('🎵 Audio pause event fired');
          syncAudioState();
        }}
        onSuspend={() => console.log('⚠️ Audio suspend')}
        onError={(e) => {
          console.error('🎵 Audio error:', e);
          syncAudioState();
        }}
          onEnded={() => {
          console.log('🎵 Audio ended');
          syncAudioState();
        }}
        onWaiting={() => console.log('🎵 Audio waiting')}
        onStalled={() => {
          console.log('🎵 Audio stalled');
          syncAudioState();
        }}
        onAbort={() => {
          console.log('🎵 Audio abort');
          syncAudioState();
          }}
        />
    </div>
  );
};

export default TheatreWorks; 