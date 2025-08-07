# 🌐 Cross-Browser Video Compatibility

## 🎯 **Problema Identificado**

Los videos solo eran visibles en Chrome debido al codec **H.264 High 4:4:4 Predictive** que no es soportado por Firefox y Opera.

### **Análisis del Codec Original:**
```bash
ffprobe -v quiet -print_format json -show_streams public/assets/videos/1.Lamp\ 1.mp4
```

**Resultado:**
- **Codec**: `h264 (High 4:4:4 Predictive)`
- **Profile**: `High 4:4:4 Predictive`
- **Pix_fmt**: `yuv444p`
- **Soporte**: Solo Chrome y Safari

## ✅ **Solución Implementada**

### **1. Múltiples Formatos de Video**

Cada video ahora tiene **3 formatos** para máxima compatibilidad:

- **MP4 (H.264)** - Chrome, Safari
- **WebM (VP8)** - Firefox, Chrome  
- **OGV (Theora)** - Firefox, Opera

### **2. Elementos HTML5 con Múltiples Fuentes**

```html
<video muted loop playsInline preload="metadata">
  <source src="video.mp4" type="video/mp4; codecs='avc1.42E01E, mp4a.40.2'" />
  <source src="video.webm" type="video/webm; codecs='vp8, vorbis'" />
  <source src="video.ogv" type="video/ogg; codecs='theora, vorbis'" />
  <p>Tu navegador no soporta el elemento de video.</p>
</video>
```

### **3. Scripts de Conversión**

#### **Test Script** (`test-convert.sh`)
```bash
./test-convert.sh
```
- Convierte un video de prueba
- Verifica que el proceso funciona

#### **Full Conversion Script** (`convert-all-videos.sh`)
```bash
./convert-all-videos.sh
```
- Convierte todos los videos restantes
- Crea formatos WebM y OGV

## 🎬 **Formatos y Compatibilidad**

| Formato | Codec | Navegadores | Tamaño | Calidad |
|---------|-------|-------------|--------|---------|
| **MP4** | H.264 | Chrome, Safari | Original | Alta |
| **WebM** | VP8 | Firefox, Chrome | ~25% | Media |
| **OGV** | Theora | Firefox, Opera | ~60% | Media |

## 🚀 **Implementación Técnica**

### **1. Estructura de Archivos**
```
public/assets/videos/
├── *.mp4          # Original (H.264)
├── webm/
│   └── *.webm     # VP8 para Firefox
└── ogv/
    └── *.ogv      # Theora para Opera
```

### **2. Configuración en Constants**
```javascript
const MEDIA_PATHS_RAW = {
  QUI_A_PEUR: {
    gifs: ['./assets/videos/*.mp4'],     // MP4
    webm: ['./assets/videos/webm/*.webm'], // WebM
    ogv: ['./assets/videos/ogv/*.ogv'],   // OGV
    audio: ['./assets/audio/*.mp3']
  }
};
```

### **3. Componente SceneGrid**
```javascript
<video muted loop playsInline preload="metadata">
  <source src={scene.video} type="video/mp4; codecs='avc1.42E01E, mp4a.40.2'" />
  {scene.webm && <source src={scene.webm} type="video/webm; codecs='vp8, vorbis'" />}
  {scene.ogv && <source src={scene.ogv} type="video/ogg; codecs='theora, vorbis'" />}
  <p>Tu navegador no soporta el elemento de video.</p>
</video>
```

## 📊 **Resultados Esperados**

### **Antes:**
- ✅ Chrome: Videos visibles
- ❌ Firefox: Videos no visibles
- ❌ Opera: Videos no visibles

### **Después:**
- ✅ Chrome: Videos visibles (MP4)
- ✅ Firefox: Videos visibles (WebM/OGV)
- ✅ Opera: Videos visibles (OGV)

## 🔧 **Comandos de Conversión**

### **Parámetros FFmpeg:**

#### **WebM (VP8):**
```bash
ffmpeg -i input.mp4 \
  -c:v libvpx -crf 30 -b:v 0 \
  -c:a libvorbis -b:a 128k \
  -vf "scale=1280:720" \
  output.webm
```

#### **OGV (Theora):**
```bash
ffmpeg -i input.mp4 \
  -c:v libtheora -q:v 7 \
  -c:a libvorbis -b:a 128k \
  -vf "scale=1280:720" \
  output.ogv
```

## 🎯 **Beneficios**

1. **Compatibilidad Universal**: Funciona en todos los navegadores principales
2. **Fallback Graceful**: Si un formato falla, usa el siguiente
3. **Optimización**: Cada navegador usa su formato preferido
4. **Mantenimiento**: Scripts automatizados para conversión

## 📝 **Notas de Implementación**

- Los videos WebM y OGV son más pequeños que los MP4 originales
- La calidad se mantiene aceptable para reproducción web
- El fallback garantiza que siempre haya un formato disponible
- Los scripts de conversión están automatizados y documentados 