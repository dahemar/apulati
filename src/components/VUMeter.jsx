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

// Connect audio element to global analyser
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
    audioElement._webAudioSource = source; // Store source on element to prevent GC
    
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
  const isMountedRef = useRef(true);

  // Get audio data for visualizations
  const getAudioData = () => {
    if (!GLOBAL_ANALYSER) return { volume: 0, waveform: [] };

    try {
      // Get frequency data for volume
      const bufferLength = GLOBAL_ANALYSER.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      GLOBAL_ANALYSER.getByteFrequencyData(dataArray);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const volume = Math.sqrt(sum / bufferLength) / 255 * 1.2; // Reduced from *2 to *1.2

      // Get waveform data
      const waveformData = new Uint8Array(bufferLength);
      GLOBAL_ANALYSER.getByteTimeDomainData(waveformData);
      const waveform = Array.from(waveformData).map(value => (value - 128) / 128);

      return { volume, waveform };
    } catch (error) {
      console.error('Error getting audio data:', error);
      return { volume: 0, waveform: [] };
    }
  };

  // Draw VU meter
  const drawVUMeter = (volume) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw VU meter bar in blue
    const barHeight = height * volume;
    const barY = height - barHeight;
    
    ctx.fillStyle = '#4A90E2'; // Blue color
    ctx.fillRect(0, barY, width, barHeight);
  };

  // Draw simple waveform
  const drawWaveform = (waveform) => {
    if (!waveformRef.current) return;
    
    const canvas = waveformRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Solo dibujar si el audio está reproduciéndose y hay datos de waveform
    if (!audioRef?.current || audioRef.current.paused || !waveform || waveform.length === 0) return;
    
    // Draw waveform in blue
    ctx.strokeStyle = '#4A90E2'; // Blue color
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const step = width / waveform.length;
    waveform.forEach((value, index) => {
      const x = index * step;
      const y = (value * height * 0.3) + height / 2;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  };

  // Update visualization
  const updateVUMeter = () => {
    if (!isMountedRef.current) return;
    
    const { volume, waveform } = getAudioData();
    drawVUMeter(volume);
    // Solo pasar waveform si hay volumen real
    drawWaveform(volume > 0.001 ? waveform : []);
  };

  // Initialize global audio context once
  useEffect(() => {
    isMountedRef.current = true;
    
    console.log('🎵 VUMeter: Initializing with canvasRef:', !!canvasRef.current, 'waveformRef:', !!waveformRef.current);
    
    if (!GLOBAL_AUDIO_CONTEXT) {
      initGlobalAudioContext();
    }
    
    // Set canvas dimensions and ensure they're visible
    if (canvasRef.current) {
      canvasRef.current.width = 30;
      canvasRef.current.height = 100;
      console.log('🎵 VUMeter: VU canvas set to 30x100');
    }
    if (waveformRef.current) {
      waveformRef.current.width = 150;
      waveformRef.current.height = 80;
      console.log('🎵 VUMeter: Waveform canvas set to 150x80');
    }
    
    // Initial draw to ensure visibility
    drawVUMeter(0);
    drawWaveform([]);
    
    // Start the animation loop
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        const { volume, waveform } = getAudioData();
        drawVUMeter(volume);
        drawWaveform(waveform);
      }
    }, 50);
    
    console.log('🎵 VUMeter: Interval started');
    
    return () => {
      console.log('🎵 VUMeter: Cleaning up');
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []); // Only run once on mount

  // Handle audio source changes without reinitializing
  useEffect(() => {
    if (audioRef?.current?.src) {
      console.log('🎵 VUMeter: Audio source changed to:', audioRef.current.src);
      
      // Don't reinitialize, just update the connection if needed
      if (GLOBAL_AUDIO_CONTEXT && GLOBAL_AUDIO_CONTEXT.state === 'suspended') {
        GLOBAL_AUDIO_CONTEXT.resume();
      }
      
      // Only attempt to connect if not already connected
      if (audioRef.current && !CONNECTED_AUDIO_ELEMENTS.has(audioRef.current)) {
        setTimeout(() => {
          connectAudioToAnalyser(audioRef.current);
        }, 100);
      }
    }
  }, [audioRef?.current?.src]);

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