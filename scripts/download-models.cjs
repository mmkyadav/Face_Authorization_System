const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const filesToDownload = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (status code: ${response.statusCode})`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      const fileName = path.basename(dest);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        file.write(chunk);
        
        if (totalSize) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`Downloading ${fileName}: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB)\r`);
        } else {
          process.stdout.write(`Downloading ${fileName}: ${(downloadedSize / 1024).toFixed(1)} KB downloaded\r`);
        }
      });
      
      response.on('end', () => {
        file.end();
        console.log(`\nSuccessfully downloaded ${fileName}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file async if there was an error
      reject(err);
    });
  });
}

async function startDownload() {
  console.log(`Starting download of face-api.js weights to: ${MODELS_DIR}`);
  console.log(`Downloading files from: ${BASE_URL}\n`);
  
  for (const file of filesToDownload) {
    const fileUrl = `${BASE_URL}${file}`;
    const destPath = path.join(MODELS_DIR, file);
    
    try {
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
        console.log(`[Skip] ${file} already exists.`);
        continue;
      }
      
      await downloadFile(fileUrl, destPath);
    } catch (err) {
      console.error(`\nError downloading ${file}:`, err.message);
      process.exit(1);
    }
  }
  
  console.log('\nAll models downloaded successfully!');
}

startDownload();
