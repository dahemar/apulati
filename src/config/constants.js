// Configuración de la aplicación
export const APP_CONFIG = {
  // Título de la aplicación
  TITLE: 'APULATI - Sound Design for Theatre',
  
  // Configuración de audio
  AUDIO: {
    LOOP: true,
    PRELOAD: 'auto',
    VOLUME: 1.0
  },
  
  // Configuración de GIFs
  GIF: {
    MAX_HEIGHT: '70vh',
    MAX_WIDTH: '100%',
    LOADING_TIMEOUT: 30000 // 30 segundos
  },
  
  // Configuración de navegación
  NAVIGATION: {
    AUTO_ADVANCE_DELAY: 5000, // 5 segundos
    TRANSITION_DURATION: 300
  },
  
  // Configuración de UI
  UI: {
    THEME: {
      BACKGROUND: '#0a0a0a',
      TEXT: '#ffffff',
      ACCENT: '#cccccc',
      BUTTON_BG: 'rgba(255,255,255,0.1)',
      BUTTON_HOVER: 'rgba(255,255,255,0.2)'
    },
    BREAKPOINTS: {
      MOBILE: 768,
      TABLET: 1024,
      DESKTOP: 1200
    }
  },
  
  // Configuración de logging
  LOGGING: {
    ENABLED: true,
    LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
    PERFORMANCE_TRACKING: true
  }
};

// Rutas de archivos multimedia
export const MEDIA_PATHS = {
  CONCOURS_DE_LARMES: {
    title: 'Concours de Larmes',
    author: 'Marvin M_Toumo',
    gifs: [
      '/apulati/assets/videos/Elie Concours 1.mp4',
      '/apulati/assets/videos/Elie Concours 2.mp4',
      '/apulati/assets/videos/Elie Concours 3.mp4'
    ],
    audio: [
      '/apulati/assets/audio/Elie Concours 1.mp3',
      '/apulati/assets/audio/Elie Concours 2.mp3',
      '/apulati/assets/audio/Elie Concours 3.mp3'
    ]
  },
  QUI_A_PEUR: {
    title: 'Qui a Peur',
    author: 'Davide-Christelle Sanvee',
    gifs: [
      '/apulati/assets/videos/1.Lamp 1.mp4',
      '/apulati/assets/videos/2.Siffle 1.mp4',
      '/apulati/assets/videos/3.Baldwin 1.mp4',
      '/apulati/assets/videos/4.Shepperd 1.mp4',
      '/apulati/assets/videos/5.Hand 1.mp4'
    ],
    audio: [
      '/apulati/assets/audio/1.Lamp 1.mp3',
      '/apulati/assets/audio/2.Siffle.mp3',
      '/apulati/assets/audio/3.Baldwin 1.mp3',
      '/apulati/assets/audio/4.Shepperd 1.mp3',
      '/apulati/assets/audio/5.Hand 1.mp3'
    ]
  }
};

// Mensajes de la aplicación
export const MESSAGES = {
  LOADING: 'Loading...',
  CLICK_TO_PLAY: 'Click to Play',
  PREVIOUS_WORK: '← Previous Work',
  NEXT_WORK: 'Next Work →',
  PREVIOUS_SCENE: '←',
  NEXT_SCENE: '→',
  ERROR_LOADING_GIF: 'Failed to load image',
  ERROR_LOADING_AUDIO: 'Failed to load audio'
};

// Configuración de rutas
export const ROUTES = {
  HOME: '/',
  MUSIC: '/music',
  CONTACT: '/contact'
}; 