#!/bin/bash

# Script para convertir videos a múltiples formatos para compatibilidad cross-browser
# Especialmente para Firefox y Opera que tienen soporte limitado para H.264 High 4:4:4

echo "🎬 Convirtiendo videos para compatibilidad cross-browser..."

# Crear directorios si no existen
mkdir -p public/assets/videos/webm
mkdir -p public/assets/videos/ogv

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

# Convertir todos los videos MP4
for video in public/assets/videos/*.mp4; do
    if [ -f "$video" ]; then
        convert_video "$video"
    fi
done

echo "🎉 Conversión completada!"
echo "📁 Formatos disponibles:"
echo "   - MP4 (H.264) - Chrome, Safari"
echo "   - WebM (VP8) - Firefox, Chrome"
echo "   - OGV (Theora) - Firefox, Opera" 