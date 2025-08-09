import React, { useState, useEffect, useRef, useMemo } from 'react';
import SceneGrid from '../components/SceneGrid';
import CreditsPanel from '../components/CreditsPanel';
import VUMeter from '../components/VUMeter';
import logger from '../utils/logger';
import './TheatreWorks.css';

const TheatreWorks = ({ works = [] }) => {
  const [currentWorkIndex, setCurrentWorkIndex] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  const audioRef = useRef(null);
  const videoSectionRef = useRef(null);
  const isMountedRef = useRef(true);

  // Transform works data to include scenes
  const transformedWorks = useMemo(() => {
    if (!works || works.length === 0) return [];
    
    console.log('🔄 Transforming works data...');
    return works.map(work => ({
      ...work,
      scenes: work.gifs ? work.gifs.map((gif, index) => ({
        video: gif,
        webm: work.webm ? work.webm[index] : null,
        ogv: work.ogv ? work.ogv[index] : null,
        safari: work.safari ? work.safari[index] : null,
        audio: work.audio ? work.audio[index] : null
      })) : [],
      credits: work.title === 'Concours de Larmes' ? [
        { role: 'Direction', name: 'Marvin M\'Toumo' },
        { role: 'Acting/Performance', name: 'Elie Autins' },
        { role: 'Light', name: 'Alessandra Domingues' },
        { role: 'Costumes', name: 'Marie Schaller' },
        { role: 'Make-up', name: 'Cham Vischel' }
      ] : [
        { role: 'Direction', name: 'Davide-Christelle Sanvee' },
        { role: 'Acting/Performance', name: 'Davide-Christelle Sanvee, Steven Schoch' },
        { role: 'Video', name: 'Dîlan Kîliç' },
        { role: 'Light', name: 'Florian Bach, Luis Henkes' },
        { role: 'Costumes', name: 'Marie Schaller' },
        { role: 'Video production', name: 'Raphaël Piguet' }
      ]
    }));
  }, [works]);

  console.log('📊 Transformed works:', transformedWorks);

  // Cleanup function to mark component as unmounted
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // One-time iOS Safari bootstrap: play all muted videos on first user gesture
  useEffect(() => {
    const bootstrapAutoplay = () => {
      const videos = document.querySelectorAll('.scene-item video');
      videos.forEach((video) => {
        try {
          video.muted = true;
          if (video.paused) {
            video.play().catch(() => {});
          }
        } catch (_) {}
      });
    };

    const onceHandler = () => {
      bootstrapAutoplay();
      window.removeEventListener('touchend', onceHandler);
      window.removeEventListener('click', onceHandler);
    };

    window.addEventListener('touchend', onceHandler, { passive: true });
    window.addEventListener('click', onceHandler);

    return () => {
      window.removeEventListener('touchend', onceHandler);
      window.removeEventListener('click', onceHandler);
    };
  }, []);

  // Function to safely update state only if component is still mounted
  const safeSetState = (setter, value) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  // Explicit controls for playback state
  const startPlayback = () => {
    safeSetState(setHasUserInteracted, true);
    safeSetState(setIsPlaying, true);
  };

  const stopPlayback = () => {
    safeSetState(setIsPlaying, false);
    safeSetState(setHasUserInteracted, false);
  };

  // Start scene playback within user gesture (ensures audio starts)
  const onStartScenePlayback = (sceneIndex, workIndex) => {
    try {
      const targetWorkIndex = typeof workIndex === 'number' ? workIndex : currentWorkIndex;
      const targetSceneIndex = sceneIndex;

      const targetWork = transformedWorks[targetWorkIndex];
      const targetScene = targetWork?.scenes?.[targetSceneIndex];

      if (!targetScene) {
        console.warn('⚠️ onStartScenePlayback: target scene not found', { targetWorkIndex, targetSceneIndex });
        return;
      }

      // Update UI state
      safeSetState(setHasUserInteracted, true);
      if (targetWorkIndex !== currentWorkIndex) safeSetState(setCurrentWorkIndex, targetWorkIndex);
      safeSetState(setCurrentSceneIndex, targetSceneIndex);

      // Prepare audio immediately
      const audio = audioRef.current;
      if (audio) {
        try {
          if (audio.src !== targetScene.audio) {
            audio.src = targetScene.audio || '';
            audio.load();
          }
        } catch (e) {
          console.warn('⚠️ Error preparing audio src:', e);
        }
      }

      // Set playing state before attempting to play media
      safeSetState(setIsPlaying, true);

      // Attempt to play audio within user gesture
      if (audio) {
        const tryPlayAudio = () => audio.play().catch((err) => console.warn('⚠️ audio.play() failed (will retry on canplay):', err));
        if (audio.readyState >= 2) {
          tryPlayAudio();
        } else {
          const onAudioCanPlay = () => {
            audio.removeEventListener('canplay', onAudioCanPlay);
            tryPlayAudio();
          };
          audio.addEventListener('canplay', onAudioCanPlay, { once: true });
        }
      }

      // Play the target video after DOM updates
      setTimeout(() => {
        const selector = `[data-work-index="${targetWorkIndex}"][data-scene-index="${targetSceneIndex}"] video`;
        const video = document.querySelector(selector);
        if (video) {
          const tryPlayVideo = () => video.play().catch((err) => console.warn('⚠️ video.play() failed (will retry on canplay):', err));
          if (video.readyState >= 2) {
            tryPlayVideo();
          } else {
            const onVideoCanPlay = () => {
              video.removeEventListener('canplay', onVideoCanPlay);
              tryPlayVideo();
            };
            video.addEventListener('canplay', onVideoCanPlay, { once: true });
          }
        } else {
          console.warn('⚠️ onStartScenePlayback: video element not found for selector', selector);
        }
      }, 50);
    } catch (e) {
      console.error('❌ onStartScenePlayback error:', e);
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

  // Handle play/pause with proper synchronization
  const handlePlayPause = () => {
    console.log('⏯️ Play/Pause requested, current state:', isPlaying);
    safeSetState(setIsPlaying, !isPlaying);
  };

  // Handle work change
  const handleWorkChange = (workIndex) => {
    console.log('🔄 Work change requested:', workIndex, 'from:', currentWorkIndex);
    
    // Pause everything before changing work
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    safeSetState(setCurrentWorkIndex, workIndex);
    safeSetState(setCurrentSceneIndex, null);
    safeSetState(setIsPlaying, false);
    safeSetState(setHasUserInteracted, false);
  };

  // Set audio source when scene changes (fallback path)
  useEffect(() => {
    if (currentSceneIndex !== null && currentWork?.scenes?.[currentSceneIndex]) {
      const scene = currentWork.scenes[currentSceneIndex];
      const audioSrc = scene.audio;
      
      if (audioSrc && audioRef.current) {
        console.log(`🎵 Scene changed - Setting audio source: ${audioSrc} work: ${currentWork.title} scene: ${currentSceneIndex}`);
        
        // Pause current audio before changing source
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        
        // Set new audio source
        audioRef.current.src = audioSrc;
        audioRef.current.load();
        console.log('🎵 Audio load() called for new source');
      } else {
        console.warn('⚠️ No audio source available for scene:', currentSceneIndex);
      }
    }
  }, [currentSceneIndex, currentWork?.title]);

  // Synchronized play/pause function
  const playMedia = async () => {
    if (currentSceneIndex === null) return;
    
    console.log('🎬 Starting synchronized playback');
    
    try {
      // Resume AudioContext if needed
      if (window.GLOBAL_AUDIO_CONTEXT && window.GLOBAL_AUDIO_CONTEXT.state === 'suspended') {
        await window.GLOBAL_AUDIO_CONTEXT.resume();
        console.log('🎵 AudioContext resumed');
      }
      
      // Play audio first
      const audio = audioRef.current;
      if (audio && audio.src) {
        if (audio.readyState >= 2) {
          await audio.play();
          console.log('✅ Audio started successfully');
        } else {
          await new Promise((resolve, reject) => {
            const handleCanPlay = () => {
              audio.play().then(resolve).catch(reject);
              audio.removeEventListener('canplay', handleCanPlay);
            };
            audio.addEventListener('canplay', handleCanPlay);
            setTimeout(() => reject(new Error('Audio ready timeout')), 5000);
          });
          console.log('✅ Audio started after waiting');
        }
      }
      
      // Then play video
      const activeVideo = document.querySelector(`[data-work-index="${currentWorkIndex}"][data-scene-index="${currentSceneIndex}"] video`);
      if (activeVideo) {
        if (activeVideo.readyState >= 2) {
          await activeVideo.play();
          console.log('✅ Video started successfully');
        } else {
          await new Promise((resolve, reject) => {
            const handleCanPlay = () => {
              activeVideo.play().then(resolve).catch(reject);
              activeVideo.removeEventListener('canplay', handleCanPlay);
            };
            activeVideo.addEventListener('canplay', handleCanPlay);
            setTimeout(() => reject(new Error('Video ready timeout')), 5000);
          });
          console.log('✅ Video started after waiting');
        }
      } else {
        console.warn('⚠️ Active video not found for work:', currentWorkIndex, 'scene:', currentSceneIndex);
      }
      
      console.log('🎬 Synchronized playback started successfully');
    } catch (error) {
      console.error('❌ Error in synchronized playback:', error);
    }
  };

  // Synchronized pause function
  const pauseMedia = () => {
    console.log('⏸️ Pausing all media');
    
    // Pause audio
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      console.log('✅ Audio paused');
    }
    
    // Pause all videos
    const allVideos = document.querySelectorAll('.scene-item video');
    allVideos.forEach((video, index) => {
      if (!video.paused) {
        video.pause();
        console.log(`✅ Video ${index} paused`);
      }
    });
  };

  // Handle play/pause state changes with synchronization
  useEffect(() => {
    if (currentSceneIndex !== null) {
      if (isPlaying) {
        playMedia();
      } else {
        pauseMedia();
      }
    }
  }, [isPlaying, currentSceneIndex]);

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
              onPlayPause={handlePlayPause}
              allWorks={transformedWorks}
              currentWorkIndex={currentWorkIndex}
              onWorkChange={handleWorkChange}
              audioRef={audioRef}
              startPlayback={startPlayback}
              onStartScenePlayback={onStartScenePlayback}
              stopPlayback={stopPlayback}
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
        onPlay={() => console.log('🎵 Audio play event fired')}
        onPause={() => console.log('🎵 Audio pause event fired')}
        onSuspend={() => console.log('⚠️ Audio suspend')}
        onError={(e) => console.error('🎵 Audio error:', e)}
        onEnded={() => console.log('🎵 Audio ended')}
        onWaiting={() => console.log('🎵 Audio waiting')}
        onStalled={() => console.log('🎵 Audio stalled')}
        onAbort={() => console.log('🎵 Audio abort')}
      />
    </div>
  );
};

export default TheatreWorks; 