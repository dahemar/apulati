#!/bin/bash

# Script para convertir videos a formato H.264 Baseline (máxima compatibilidad con Safari)
echo "🍎 Convirtiendo videos para compatibilidad máxima con Safari (perfil Baseline)..."

# Crear directorio si no existe
mkdir -p public/assets/videos/safari-baseline

# Función para convertir un video
convert_video() {
    local input_file="$1"
    local base_name=$(basename "$input_file" .mp4)
    
    echo "🔄 Convirtiendo para Safari Baseline: $base_name"
    
    # Convertir a H.264 Baseline Profile (máxima compatibilidad con Safari)
    ffmpeg -i "$input_file" \
        -c:v libx264 -profile:v baseline -preset medium -crf 23 \
        -c:a aac -b:a 128k \
        -vf "scale=1280:720" \
        -movflags +faststart \
        "public/assets/videos/safari-baseline/${base_name}.mp4" \
        -y
    
    echo "✅ Convertido para Safari Baseline: $base_name"
}

# Lista de videos a convertir
videos=(
    "public/assets/videos/1.Lamp 1.mp4"
    "public/assets/videos/2.Siffle 1.mp4"
    "public/assets/videos/3.Baldwin 1.mp4"
    "public/assets/videos/4.Shepperd 1.mp4"
    "public/assets/videos/5.Hand 1.mp4"
    "public/assets/videos/Elie Concours 1.mp4"
    "public/assets/videos/Elie Concours 2.mp4"
    "public/assets/videos/Elie Concours 3.mp4"
)

# Convertir todos los videos
for video in "${videos[@]}"; do
    if [ -f "$video" ]; then
        convert_video "$video"
    else
        echo "⚠️ Archivo no encontrado: $video"
    fi
done

echo "🎉 Conversión para Safari Baseline completada!"
echo "📁 Archivos creados en: public/assets/videos/safari-baseline/" 