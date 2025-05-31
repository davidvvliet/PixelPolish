import express from 'express';
import cors from 'cors';
import serveStatic from 'serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMCapture } from './dom/DOMCapture.js';
import { CSSExtractor } from './css/CSSExtractor.js';
import { HeuristicsEngine } from './heuristics/HeuristicsEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use('/public', serveStatic(path.join(__dirname, '../public')));

// Serve local files for analysis
app.use('/local', serveStatic(path.join(__dirname, '../local')));

// Initialize components
const domCapture = new DOMCapture();
const cssExtractor = new CSSExtractor();
const heuristicsEngine = new HeuristicsEngine();

// Store latest analysis results
let latestAnalysis = null;

// Routes
app.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Analyzing URL: ${url}`);

    // Step 1: Capture DOM
    const domData = await domCapture.capture(url);
    
    // Step 2: Extract CSS styles
    const cssData = await cssExtractor.extract(domData);
    
    // Step 3: Run heuristics analysis
    const analysisResults = await heuristicsEngine.analyze(domData, cssData);

    const result = {
      success: true,
      data: {
        dom: domData,
        css: cssData,
        analysis: analysisResults
      }
    };

    // Store for dashboard
    latestAnalysis = result;

    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// New endpoint for analyzing local files
app.post('/analyze-local', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Construct local URL
    const localUrl = `http://localhost:${PORT}/local/${filename}`;
    console.log(`Analyzing local file: ${filename} at ${localUrl}`);

    // Step 1: Capture DOM
    const domData = await domCapture.capture(localUrl);
    
    // Step 2: Extract CSS styles
    const cssData = await cssExtractor.extract(domData);
    
    // Step 3: Run heuristics analysis
    const analysisResults = await heuristicsEngine.analyze(domData, cssData);

    const result = {
      success: true,
      filename,
      analyzedAt: new Date().toISOString(),
      data: {
        dom: domData,
        css: cssData,
        analysis: analysisResults
      }
    };

    // Store for dashboard
    latestAnalysis = result;

    res.json(result);

  } catch (error) {
    console.error('Local analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Dashboard endpoint to get latest analysis
app.get('/dashboard', (req, res) => {
  if (!latestAnalysis) {
    return res.json({ 
      success: false, 
      message: 'No analysis available yet. Analyze a file first.' 
    });
  }

  res.json(latestAnalysis);
});

// Serve dashboard HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PixelPolish Dashboard</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .analysis-card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .score { font-size: 48px; font-weight: bold; color: #007AFF; }
            .issues { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
            .issue { padding: 15px; border-radius: 6px; }
            .issue.high { background: #FFE6E6; border-left: 4px solid #FF3B30; }
            .issue.medium { background: #FFF3E6; border-left: 4px solid #FF9500; }
            .issue.low { background: #E6F7FF; border-left: 4px solid #007AFF; }
            .rule-breakdown { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .rule { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px; }
            .rule-score { font-size: 24px; font-weight: bold; }
            .auto-refresh { color: #28a745; margin-left: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎨 PixelPolish Dashboard</h1>
                <p>Real-time analysis of your local HTML files <span class="auto-refresh">● Auto-refreshing</span></p>
                <div>
                    <strong>Local File Server:</strong> <a href="/local/" target="_blank">http://localhost:${PORT}/local/</a><br>
                    <strong>Instructions:</strong> Place your HTML files in the <code>local/</code> directory and they'll be analyzed automatically.
                </div>
            </div>
            <div id="analysis-content">
                <div class="analysis-card">
                    <h2>No analysis available yet</h2>
                    <p>Place an HTML file in the <code>local/</code> directory and start the file watcher with <code>npm run watch</code></p>
                </div>
            </div>
        </div>

        <script>
            async function loadAnalysis() {
                try {
                    const response = await fetch('/dashboard');
                    const data = await response.json();
                    
                    if (data.success) {
                        displayAnalysis(data);
                    } else {
                        document.getElementById('analysis-content').innerHTML = \`
                            <div class="analysis-card">
                                <h2>No analysis available yet</h2>
                                <p>\${data.message}</p>
                            </div>
                        \`;
                    }
                } catch (error) {
                    console.error('Failed to load analysis:', error);
                }
            }

            function displayAnalysis(data) {
                const analysis = data.data.analysis;
                const dom = data.data.dom;
                
                const content = \`
                    <div class="analysis-card">
                        <h2>📊 Analysis Results</h2>
                        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <div class="score">\${analysis.scorePercentage}%</div>
                                <div>Overall Score</div>
                            </div>
                            <div>
                                <h3>\${data.filename || dom.title}</h3>
                                <p><strong>Elements:</strong> \${dom.totalElements} | <strong>Issues:</strong> \${analysis.summary.totalIssues}</p>
                                <p><small>Last analyzed: \${new Date(data.analyzedAt || data.data.dom.capturedAt).toLocaleString()}</small></p>
                            </div>
                        </div>
                    </div>

                    <div class="analysis-card">
                        <h3>🔴 Issues Found</h3>
                        <div class="issues">
                            \${analysis.issues.slice(0, 6).map(issue => \`
                                <div class="issue \${issue.severity}">
                                    <strong>[\${issue.severity.toUpperCase()}]</strong> \${issue.message}
                                    \${issue.suggestion ? \`<br><small><em>\${issue.suggestion}</em></small>\` : ''}
                                </div>
                            \`).join('')}
                        </div>
                    </div>

                    <div class="analysis-card">
                        <h3>📊 Rule Breakdown</h3>
                        <div class="rule-breakdown">
                            \${analysis.ruleResults.map(rule => {
                                const percentage = rule.maxScore > 0 ? Math.round((rule.score / rule.maxScore) * 100) : 0;
                                return \`
                                    <div class="rule">
                                        <div class="rule-score" style="color: \${percentage >= 80 ? '#28a745' : percentage >= 60 ? '#ffc107' : '#dc3545'}">\${percentage}%</div>
                                        <div>\${rule.ruleName}</div>
                                        <small>\${rule.score}/\${rule.maxScore} points</small>
                                    </div>
                                \`;
                            }).join('')}
                        </div>
                    </div>
                \`;

                document.getElementById('analysis-content').innerHTML = content;
            }

            // Load analysis on page load
            loadAnalysis();

            // Auto-refresh every 2 seconds
            setInterval(loadAnalysis, 2000);
        </script>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`PixelPolish agent running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Analysis endpoint: POST http://localhost:${PORT}/analyze`);
  console.log(`Local analysis endpoint: POST http://localhost:${PORT}/analyze-local`);
  console.log(`Local files: http://localhost:${PORT}/local/`);
}); 