import React, { useEffect, useRef } from 'react';
import './VUMeter.css';

// Global Web Audio API context
let GLOBAL_AUDIO_CONTEXT = null;
let GLOBAL_ANALYSER = null;
const CONNECTED_AUDIO_ELEMENTS = new WeakSet();

// Initialize global context
const initGlobalAudioContext = () => {
  if (!GLOBAL_AUDIO_CONTEXT) {
    try {
      GLOBAL_AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();
      GLOBAL_ANALYSER = GLOBAL_AUDIO_CONTEXT.createAnalyser();
      GLOBAL_ANALYSER.fftSize = 256;
      GLOBAL_ANALYSER.smoothingTimeConstant = 0.8;
      
      // Connect to destination to ensure sound plays
      GLOBAL_ANALYSER.connect(GLOBAL_AUDIO_CONTEXT.destination);
      
      // Expose globally for external access
      window.GLOBAL_AUDIO_CONTEXT = GLOBAL_AUDIO_CONTEXT;
      window.GLOBAL_ANALYSER = GLOBAL_ANALYSER;
      
      console.log('🎵 Global AudioContext initialized');
    } catch (error) {
      console.error('🎵 Error initializing global AudioContext:', error);
    }
  }
  return { context: GLOBAL_AUDIO_CONTEXT, analyser: GLOBAL_ANALYSER };
};

// Connect audio element to global analyser - IMPROVED
const connectAudioToAnalyser = (audioElement) => {
  if (!audioElement) {
    console.log('🔗 No audio element provided for connection');
    return;
  }

  if (CONNECTED_AUDIO_ELEMENTS.has(audioElement)) {
    console.log('🔗 Audio already connected, src:', audioElement.src);
    return;
  }

  const { context, analyser } = initGlobalAudioContext();
  if (!context || !analyser) {
    console.log('🔗 No global audio context available');
    return;
  }

  try {
    // Create source and connect to analyser
    const source = context.createMediaElementSource(audioElement);
    source.connect(analyser);
    
    // Mark as connected
    CONNECTED_AUDIO_ELEMENTS.add(audioElement);
    audioElement._webAudioSource = source;
    
    console.log('🔗 Audio connected to global analyser successfully, src:', audioElement.src);
  } catch (error) {
    console.error('🔗 Error connecting audio to analyser:', error);
    // Don't mark as connected if there was an error
  }
};

const VUMeter = ({ audioRef }) => {
  const canvasRef = useRef(null);
  const waveformRef = useRef(null);
  const intervalRef = useRef(null);
  const waveformDataRef = useRef([]);
  const isMountedRef = useRef(true);
  const connectionAttemptedRef = useRef(false);

  // Get audio data
  const getAudioData = () => {
    if (!GLOBAL_ANALYSER) return { volume: 0, waveform: [], bass: 0, mid: 0, treble: 0 };

    const bufferLength = GLOBAL_ANALYSER.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const waveformArray = new Uint8Array(bufferLength);
    
    GLOBAL_ANALYSER.getByteFrequencyData(dataArray);
    GLOBAL_ANALYSER.getByteTimeDomainData(waveformArray);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const amplitude = (waveformArray[i] - 128) / 128;
      sum += amplitude * amplitude;
    }
    const volume = Math.sqrt(sum / bufferLength);

    // Calculate frequency bands
    const bass = Math.max(...dataArray.slice(0, Math.floor(bufferLength * 0.1)));
    const mid = Math.max(...dataArray.slice(Math.floor(bufferLength * 0.1), Math.floor(bufferLength * 0.5)));
    const treble = Math.max(...dataArray.slice(Math.floor(bufferLength * 0.5)));

    return { 
      volume: Math.min(volume * 2, 1), 
      waveform: Array.from(waveformArray), 
      bass: bass / 255, 
      mid: mid / 255, 
      treble: treble / 255 
    };
  };

  // Draw VU meter
  const drawVUMeter = (volume = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || !isMountedRef.current) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = 60;
    const height = canvas.height = 200;

    ctx.clearRect(0, 0, width, height);

    // Draw bars
    const barHeight = height * volume;
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(1, '#4A90E2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(10, height - barHeight, 40, barHeight);
  };

  // Draw waveform
  const drawWaveform = (volume, frequencyData) => {
    const canvas = waveformRef.current;
    if (!canvas || !isMountedRef.current) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = 200;
    const height = canvas.height = 100;

    ctx.clearRect(0, 0, width, height);

    // Solo dibujar si hay datos de frecuencia Y el audio está reproduciéndose con volumen
    if (!frequencyData || frequencyData.length === 0 || !audioRef?.current || audioRef.current.paused || volume < 0.001) return;

    // Store waveform data for trail effect
    waveformDataRef.current.push({ data: [...frequencyData], timestamp: Date.now() });
    
    // Keep only recent data (last 2 seconds)
    const now = Date.now();
    waveformDataRef.current = waveformDataRef.current.filter(item => now - item.timestamp < 2000);

    // Draw waveform trail
    waveformDataRef.current.forEach((item, index) => {
      const age = now - item.timestamp;
      const opacity = Math.max(0.1, 1 - (age / 2000));
      
      ctx.strokeStyle = `rgba(74, 144, 226, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / item.data.length;
      let x = 0;

      for (let i = 0; i < item.data.length; i++) {
        const v = item.data[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
    });
  };

  // Update visualization
  const updateVUMeter = () => {
    if (!isMountedRef.current) return;
    
    const { volume, waveform, bass, mid, treble } = getAudioData();
    drawVUMeter(volume);
    drawWaveform(volume, waveform);
  };

  // Event handlers - IMPROVED
  const handlePlay = () => {
    console.log('🎵 VUMeter: Audio play event received, src:', audioRef?.current?.src);
    
    // Only attempt connection once per audio element
    if (!connectionAttemptedRef.current && audioRef?.current) {
      connectionAttemptedRef.current = true;
      
      // Attempt to connect to Web Audio API with delay
      setTimeout(() => {
        console.log('🎵 VUMeter: Attempting to connect to Web Audio API for src:', audioRef?.current?.src);
        if (audioRef?.current && isMountedRef.current) {
          connectAudioToAnalyser(audioRef.current);
        }
      }, 200); // Increased delay
    }
  };

  const handlePause = () => {
    console.log('🎵 VUMeter: Audio pause event received');
  };

  const handleLoadStart = () => {
    console.log('🎵 VUMeter: Audio loadstart event received');
    // Reset connection attempt when audio source changes
    connectionAttemptedRef.current = false;
  };

  const handleCanPlay = () => {
    console.log('🎵 VUMeter: Audio canplay event received');
  };

  // Setup effect
  useEffect(() => {
    isMountedRef.current = true;
    console.log('🎵 VUMeter: Setting up with audioRef:', !!audioRef?.current);
    
    if (!audioRef?.current || !canvasRef.current || !waveformRef.current) {
      return;
    }

    const audio = audioRef.current;

    // Initialize global context
    initGlobalAudioContext();

    // Start drawing loop
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updateVUMeter, 50);
    console.log('🎵 VUMeter: Interval started');

    // Initial draw
    drawVUMeter(0);
    drawWaveform(0, []);

    // Add event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    // Cleanup
    return () => {
      console.log('🎵 VUMeter: Cleaning up');
      isMountedRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (audio) {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, [audioRef?.current?.src]); // Only re-run when audio source changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="vu-meter">
      <canvas ref={canvasRef} className="vu-canvas" />
      <canvas ref={waveformRef} className="waveform-canvas" />
    </div>
  );
};

export default VUMeter;
 