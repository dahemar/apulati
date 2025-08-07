// Debug script to check React component paths
console.log('🔍 Debugging React video paths...');

// Check if we can access the constants
import { MEDIA_PATHS_RAW } from './src/config/constants.js';

console.log('📁 MEDIA_PATHS_RAW structure:');
console.log(JSON.stringify(MEDIA_PATHS_RAW, null, 2));

// Check specific paths
const quiAPeur = MEDIA_PATHS_RAW.QUI_A_PEUR;
console.log('🎬 QUI_A_PEUR paths:');
console.log('Original videos:', quiAPeur.gifs);
console.log('Safari videos:', quiAPeur.safari);
console.log('WebM videos:', quiAPeur.webm);
console.log('OGV videos:', quiAPeur.ogv);

// Test file accessibility
const testFileAccess = async (url) => {
    try {
        const response = await fetch(url);
        return {
            accessible: response.ok,
            status: response.status,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
        };
    } catch (error) {
        return {
            accessible: false,
            error: error.message
        };
    }
};

// Test all video files
const testAllFiles = async () => {
    console.log('🧪 Testing file accessibility...');
    
    const filesToTest = [
        ...quiAPeur.gifs,
        ...quiAPeur.safari,
        ...quiAPeur.webm,
        ...quiAPeur.ogv
    ];
    
    for (const file of filesToTest) {
        const result = await testFileAccess(file);
        console.log(`${file}:`, result);
    }
};

testAllFiles(); 