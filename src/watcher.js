import chokidar from 'chokidar';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_DIR = path.join(__dirname, '../local');
const API_URL = 'http://localhost:3002';

console.log('🔍 PixelPolish File Watcher Starting...');
console.log(`📁 Watching directory: ${LOCAL_DIR}`);
console.log(`🌐 API Server: ${API_URL}`);

// Function to analyze a file
async function analyzeFile(filePath) {
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  
  // Only analyze HTML files
  if (ext !== '.html' && ext !== '.htm') {
    return;
  }

  console.log(`📊 Analyzing: ${filename}`);
  
  try {
    const response = await fetch(`${API_URL}/analyze-local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename })
    });

    if (response.ok) {
      const result = await response.json();
      const analysis = result.data.analysis;
      
      console.log(`✅ Analysis complete for ${filename}`);
      console.log(`   Score: ${analysis.scorePercentage}%`);
      console.log(`   Issues: ${analysis.summary.totalIssues}`);
      console.log(`   View dashboard: ${API_URL}`);
      
      // Show top issues
      if (analysis.issues.length > 0) {
        console.log('   Top issues:');
        analysis.issues.slice(0, 3).forEach((issue, index) => {
          console.log(`     ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        });
      }
      
    } else {
      const error = await response.json();
      console.error(`❌ Analysis failed for ${filename}: ${error.error}`);
    }
  } catch (error) {
    console.error(`❌ Error analyzing ${filename}:`, error.message);
  }
}

// Check if API server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log('✅ PixelPolish server is running');
      return true;
    }
  } catch (error) {
    console.error('❌ PixelPolish server is not running. Please start it with: npm start');
    return false;
  }
}

// Initialize the watcher
async function startWatcher() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  // Watch for file changes
  const watcher = chokidar.watch(`${LOCAL_DIR}/**/*.{html,htm}`, {
    ignored: /^\./, // ignore dotfiles
    persistent: true,
    ignoreInitial: false // analyze existing files on startup
  });

  watcher
    .on('add', filePath => {
      console.log(`📁 File added: ${path.basename(filePath)}`);
      analyzeFile(filePath);
    })
    .on('change', filePath => {
      console.log(`📝 File changed: ${path.basename(filePath)}`);
      analyzeFile(filePath);
    })
    .on('unlink', filePath => {
      console.log(`🗑️  File removed: ${path.basename(filePath)}`);
    })
    .on('error', error => {
      console.error('Watcher error:', error);
    });

  console.log('🚀 File watcher is running. Make changes to HTML files in the local/ directory.');
  console.log(`📊 Dashboard: ${API_URL}`);
  console.log('Press Ctrl+C to stop');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping file watcher...');
  process.exit(0);
});

startWatcher(); 