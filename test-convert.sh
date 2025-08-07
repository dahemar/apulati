#!/bin/bash

# Script de prueba para convertir un video a múltiples formatos
echo "🎬 Prueba de conversión de video para compatibilidad cross-browser..."

# Crear directorios si no existen
mkdir -p public/assets/videos/webm
mkdir -p public/assets/videos/ogv

# Convertir solo el primer video como prueba
input_file="public/assets/videos/1.Lamp 1.mp4"
base_name="1.Lamp 1"

echo "🔄 Convirtiendo: $base_name"

# Convertir a WebM (VP8) - Excelente soporte en Firefox
ffmpeg -i "$input_file" \
    -c:v libvpx -crf 30 -b:v 0 \
    -c:a libvorbis -b:a 128k \
    -vf "scale=1280:720" \
    "public/assets/videos/webm/${base_name}.webm" \
    -y

# Convertir a OGV (Theora) - Soporte nativo en Firefox
ffmpeg -i "$input_file" \
    -c:v libtheora -q:v 7 \
    -c:a libvorbis -b:a 128k \
    -vf "scale=1280:720" \
    "public/assets/videos/ogv/${base_name}.ogv" \
    -y

echo "✅ Conversión de prueba completada!"
echo "📁 Archivos creados:"
echo "   - public/assets/videos/webm/${base_name}.webm"
echo "   - public/assets/videos/ogv/${base_name}.ogv" 