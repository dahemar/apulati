#!/bin/bash

# Script para convertir todos los videos restantes a múltiples formatos
echo "🎬 Convirtiendo todos los videos para compatibilidad cross-browser..."

# Crear directorios si no existen
mkdir -p public/assets/videos/webm
mkdir -p public/assets/videos/ogv

# Lista de videos a convertir (excluyendo el que ya convertimos)
videos=(
    "public/assets/videos/2.Siffle 1.mp4"
    "public/assets/videos/3.Baldwin 1.mp4"
    "public/assets/videos/4.Shepperd 1.mp4"
    "public/assets/videos/5.Hand 1.mp4"
    "public/assets/videos/Elie Concours 1.mp4"
    "public/assets/videos/Elie Concours 2.mp4"
    "public/assets/videos/Elie Concours 3.mp4"
)

# Función para convertir un video
convert_video() {
    local input_file="$1"
    local base_name=$(basename "$input_file" .mp4)
    
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
    
    echo "✅ Convertido: $base_name"
}

# Convertir todos los videos
for video in "${videos[@]}"; do
    if [ -f "$video" ]; then
        convert_video "$video"
    else
        echo "⚠️ Archivo no encontrado: $video"
    fi
done

echo "🎉 Conversión completada!"
echo "📁 Formatos disponibles:"
echo "   - MP4 (H.264) - Chrome, Safari"
echo "   - WebM (VP8) - Firefox, Chrome"
echo "   - OGV (Theora) - Firefox, Opera" 