/**
 * Express Server for PixelPolish Comprehensive AI Agent
 * Serves API endpoints, dashboard, and local files
 */

import express from 'express';
import cors from 'cors';
import serveStatic from 'serve-static';
import { join } from 'path';
import { fileURLToPath } from 'url';
import type { PixelPolishConfig, ComprehensiveAnalysis } from './types.js';
import { DOMCaptureService } from './dom-capture.js';
import { CSSExtractorService } from './css-extractor.js';
import { HeuristicsEngineService } from './heuristics-engine.js';
import { ScreenshotService } from './screenshot.js';
import { AIAnalyzer } from './analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

export class PixelPolishServer {
  private app: express.Application;
  private config: PixelPolishConfig;
  private domCapture: DOMCaptureService;
  private cssExtractor: CSSExtractorService;
  private heuristicsEngine: HeuristicsEngineService;
  private screenshotService: ScreenshotService;
  private aiAnalyzer: AIAnalyzer;
  private latestAnalysis: ComprehensiveAnalysis | null = null;

  constructor(config: PixelPolishConfig) {
    this.config = config;
    this.app = express();
    
    // Initialize services
    this.domCapture = new DOMCaptureService();
    this.cssExtractor = new CSSExtractorService();
    this.heuristicsEngine = new HeuristicsEngineService();
    this.screenshotService = new ScreenshotService(config.screenshotsDir);
    this.aiAnalyzer = new AIAnalyzer(config.aiProvider);

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Serve static files from public directory
    this.app.use('/public', serveStatic(join(__dirname, '../public')));

    // Serve local files for analysis with no-cache headers
    this.app.use('/local', (req, res, next) => {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      next();
    }, serveStatic(this.config.localDir));
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Comprehensive analysis endpoint
    this.app.post('/analyze', async (req, res) => {
      try {
        const { url } = req.body;
        
        if (!url) {
          return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`🔍 Starting comprehensive analysis of: ${url}`);
        
        const analysis = await this.performComprehensiveAnalysis(url);
        
        res.json(analysis);

      } catch (error) {
        console.error('❌ Analysis error:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Analysis failed'
        });
      }
    });

    // Local file analysis endpoint
    this.app.post('/analyze-local', async (req, res) => {
      try {
        const { filename } = req.body;
        
        if (!filename) {
          return res.status(400).json({ error: 'Filename is required' });
        }

        // Construct local URL with timestamp to bypass cache
        const timestamp = Date.now();
        const localUrl = `http://localhost:${this.config.port}/local/${filename}?t=${timestamp}`;
        
        console.log(`🔍 Starting comprehensive analysis of local file: ${filename}`);
        
        const analysis = await this.performComprehensiveAnalysis(localUrl, filename);
        
        res.json(analysis);

      } catch (error) {
        console.error('❌ Local analysis error:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Analysis failed'
        });
      }
    });

    // Dashboard endpoint to get latest analysis
    this.app.get('/dashboard', (req, res) => {
      if (!this.latestAnalysis) {
        return res.json({ 
          success: false, 
          message: 'No analysis available yet. Analyze a file first.' 
        });
      }

      res.json(this.latestAnalysis);
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        services: {
          domCapture: true,
          cssExtractor: true,
          heuristicsEngine: true,
          screenshotService: this.screenshotService.checkInitialized(),
          aiAnalyzer: true
        }
      });
    });

    // Dashboard HTML interface
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });
  }

  /**
   * Perform comprehensive analysis combining all services
   */
  private async performComprehensiveAnalysis(url: string, filename?: string): Promise<ComprehensiveAnalysis> {
    const startTime = Date.now();
    
    try {
      // Step 1: Capture DOM structure and data
      console.log('📡 1/5 Capturing DOM structure...');
      const domData = await this.domCapture.capture(url);
      
      // Step 2: Extract CSS patterns and analysis
      console.log('🎨 2/5 Extracting CSS patterns...');
      const cssData = await this.cssExtractor.extract(domData.elements);
      
      // Step 3: Run heuristics analysis for technical scoring
      console.log('📊 3/5 Running heuristics analysis...');
      const technicalAnalysis = await this.heuristicsEngine.analyze(domData, cssData);
      
      // Step 4: Take screenshot for visual analysis
      console.log('📸 4/5 Capturing screenshot...');
      const screenshotResult = await this.screenshotService.takeScreenshot(url, filename || 'analysis');
      
      // Step 5: Run AI visual analysis
      console.log('🤖 5/5 Running AI visual analysis...');
      const visualAnalysis = await this.aiAnalyzer.analyzeScreenshot(
        screenshotResult.screenshotBase64,
        { success: true, data: { dom: domData, css: cssData, analysis: technicalAnalysis } }
      );

      // Combine results into comprehensive analysis
      const combinedScore = Math.round(
        (technicalAnalysis.scorePercentage * 0.6) + (visualAnalysis.visual_score * 0.4)
      );

      const comprehensiveAnalysis: ComprehensiveAnalysis = {
        success: true,
        filename: filename || domData.title,
        analyzedAt: new Date().toISOString(),
        technical: technicalAnalysis,
        visual: visualAnalysis,
        screenshot: screenshotResult,
        combined_score: combinedScore,
        priority_actions: visualAnalysis.priority_fixes.slice(0, 5)
      };

      // Store for dashboard
      this.latestAnalysis = comprehensiveAnalysis;

      const duration = Date.now() - startTime;
      console.log(`✅ Comprehensive analysis complete in ${duration}ms`);
      console.log(`📊 Combined Score: ${combinedScore}% (Technical: ${technicalAnalysis.scorePercentage}%, Visual: ${visualAnalysis.visual_score}%)`);
      console.log(`🔧 Priority Actions: ${comprehensiveAnalysis.priority_actions.length}`);

      return comprehensiveAnalysis;

    } catch (error) {
      console.error('❌ Comprehensive analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate dashboard HTML
   */
  private getDashboardHTML(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PixelPolish AI Agent Dashboard</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
              .container { max-width: 1400px; margin: 0 auto; }
              .header { background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header h1 { margin: 0; color: #2d3748; font-size: 2.5rem; }
              .header p { margin: 10px 0 0 0; color: #718096; font-size: 1.1rem; }
              .status-badge { display: inline-block; background: #48bb78; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; margin-left: 10px; }
              .analysis-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
              .analysis-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .score-display { display: flex; align-items: center; gap: 30px; margin-bottom: 25px; }
              .score-circle { position: relative; width: 120px; height: 120px; }
              .score-number { font-size: 2.5rem; font-weight: bold; color: #4299e1; }
              .score-label { font-size: 0.9rem; color: #718096; margin-top: 5px; }
              .mini-scores { display: flex; gap: 20px; }
              .mini-score { text-align: center; padding: 15px; background: #f7fafc; border-radius: 8px; }
              .priority-fixes { margin-top: 20px; }
              .fix-item { padding: 15px; margin: 10px 0; border-left: 4px solid #4299e1; background: #f0f9ff; border-radius: 0 8px 8px 0; }
              .fix-priority { font-weight: bold; color: #2b6cb0; text-transform: uppercase; font-size: 0.8rem; }
              .issues-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 20px; }
              .issue { padding: 15px; border-radius: 8px; border-left: 4px solid; }
              .issue.critical { background: #fed7d7; border-color: #e53e3e; }
              .issue.high { background: #feebc8; border-color: #dd6b20; }
              .issue.medium { background: #fefcbf; border-color: #d69e2e; }
              .issue.low { background: #e6fffa; border-color: #38b2ac; }
              .rule-breakdown { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
              .rule { text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
              .rule-score { font-size: 1.8rem; font-weight: bold; margin-bottom: 5px; }
              .rule-name { font-size: 0.9rem; color: #4a5568; }
              .auto-refresh { color: #48bb78; animation: pulse 2s infinite; }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
              .metadata { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px; margin-bottom: 20px; }
              .screenshot-preview { max-width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-top: 15px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🤖 PixelPolish AI Agent</h1>
                  <p>Comprehensive UI Analysis with Technical Scoring + AI Visual Assessment<span class="auto-refresh status-badge">● Live</span></p>
                  <div style="margin-top: 15px; font-size: 0.95rem; color: #4a5568;">
                      <strong>Local Files:</strong> <a href="/local/" target="_blank">http://localhost:${this.config.port}/local/</a> | 
                      <strong>API:</strong> POST /analyze-local | 
                      <strong>Health:</strong> <a href="/health" target="_blank">/health</a>
                  </div>
              </div>
              
              <div id="analysis-content">
                  <div class="analysis-card">
                      <h2>🚀 Ready for Analysis</h2>
                      <p>Place HTML files in the <code>local/</code> directory or use the API endpoints to start analysis.</p>
                      <div style="margin-top: 20px; padding: 15px; background: #e6fffa; border-radius: 8px;">
                          <strong>🎯 What the AI Agent provides:</strong><br>
                          • DOM structure analysis with Puppeteer<br>
                          • CSS pattern extraction and consistency checking<br>
                          • 190-point heuristics scoring system<br>
                          • Playwright screenshot capture<br>
                          • AI visual assessment with GPT-4V/Claude<br>
                          • Automated fix suggestions and prioritization
                      </div>
                  </div>
              </div>
          </div>

          <script>
              async function loadAnalysis() {
                  try {
                      const response = await fetch('/dashboard');
                      const data = await response.json();
                      
                      if (data.success) {
                          displayComprehensiveAnalysis(data);
                      } else {
                          document.getElementById('analysis-content').innerHTML = \`
                              <div class="analysis-card">
                                  <h2>📋 No analysis available</h2>
                                  <p>\${data.message}</p>
                              </div>
                          \`;
                      }
                  } catch (error) {
                      console.error('Failed to load analysis:', error);
                  }
              }

              function displayComprehensiveAnalysis(data) {
                  const content = \`
                      <div class="analysis-grid">
                          <div class="analysis-card">
                              <div class="metadata">
                                  <div>
                                      <h2 style="margin: 0;">\${data.filename}</h2>
                                      <small>Analyzed: \${new Date(data.analyzedAt).toLocaleString()}</small>
                                  </div>
                                  <div style="text-align: right;">
                                      <div>Elements: \${data.technical.summary.totalIssues}</div>
                                      <div>Issues: \${data.technical.summary.totalIssues}</div>
                                  </div>
                              </div>

                              <div class="score-display">
                                  <div class="score-circle" style="text-align: center;">
                                      <div class="score-number">\${data.combined_score}%</div>
                                      <div class="score-label">Combined Score</div>
                                  </div>
                                  <div class="mini-scores">
                                      <div class="mini-score">
                                          <div style="font-size: 1.5rem; font-weight: bold; color: #805ad5;">\${data.technical.scorePercentage}%</div>
                                          <div style="font-size: 0.8rem; color: #718096;">Technical</div>
                                      </div>
                                      <div class="mini-score">
                                          <div style="font-size: 1.5rem; font-weight: bold; color: #38b2ac;">\${data.visual.visual_score}%</div>
                                          <div style="font-size: 0.8rem; color: #718096;">Visual AI</div>
                                      </div>
                                  </div>
                              </div>

                              <div class="priority-fixes">
                                  <h3>🎯 Priority AI Fixes</h3>
                                  \${data.priority_actions.slice(0, 3).map(fix => \`
                                      <div class="fix-item">
                                          <div class="fix-priority">[\${fix.priority}] \${fix.element}</div>
                                          <div style="margin: 8px 0; font-weight: 500;">\${fix.issue}</div>
                                          <div style="font-size: 0.9rem; color: #4a5568;">\${fix.fix}</div>
                                          \${fix.css_change ? \`<code style="display: block; margin-top: 8px; padding: 8px; background: #1a202c; color: #63b3ed; border-radius: 4px; font-size: 0.8rem;">\${fix.css_change}</code>\` : ''}
                                      </div>
                                  \`).join('')}
                              </div>

                              <div class="rule-breakdown">
                                  \${data.technical.ruleResults.map(rule => {
                                      const percentage = rule.maxScore > 0 ? Math.round((rule.score / rule.maxScore) * 100) : 0;
                                      const color = percentage >= 80 ? '#48bb78' : percentage >= 60 ? '#ed8936' : '#e53e3e';
                                      return \`
                                          <div class="rule">
                                              <div class="rule-score" style="color: \${color}">\${percentage}%</div>
                                              <div class="rule-name">\${rule.ruleName}</div>
                                              <small>\${rule.score}/\${rule.maxScore} points</small>
                                          </div>
                                      \`;
                                  }).join('')}
                              </div>
                          </div>

                          <div>
                              <div class="analysis-card">
                                  <h3>📸 Screenshot</h3>
                                  <img src="data:image/png;base64,\${data.screenshot.screenshotBase64}" class="screenshot-preview" alt="Page screenshot">
                                  <div style="margin-top: 10px; font-size: 0.9rem; color: #718096;">
                                      Captured: \${new Date(data.screenshot.timestamp).toLocaleString()}
                                  </div>
                              </div>

                              <div class="analysis-card" style="margin-top: 20px;">
                                  <h3>🤖 AI Assessment</h3>
                                  <div style="margin: 15px 0;">
                                      <strong>Overall Quality:</strong> \${data.visual.visual_assessment.overall_quality}<br>
                                      <strong>Color Harmony:</strong> \${data.visual.visual_assessment.color_harmony}<br>
                                      <strong>Layout Balance:</strong> \${data.visual.visual_assessment.layout_balance}<br>
                                      <strong>Accessibility:</strong> \${data.visual.visual_assessment.accessibility_score}%
                                  </div>
                                  <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 0.9rem; line-height: 1.4;">
                                      \${data.visual.detailed_feedback}
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div class="analysis-card" style="margin-top: 20px;">
                          <h3>🔍 Technical Issues</h3>
                          <div class="issues-grid">
                              \${data.technical.issues.slice(0, 8).map(issue => \`
                                  <div class="issue \${issue.severity}">
                                      <strong>[\${issue.severity.toUpperCase()}]</strong> \${issue.message}
                                      \${issue.suggestion ? \`<br><small><em>\${issue.suggestion}</em></small>\` : ''}
                                  </div>
                              \`).join('')}
                          </div>
                      </div>
                  \`;

                  document.getElementById('analysis-content').innerHTML = content;
              }

              // Load analysis on page load
              loadAnalysis();

              // Auto-refresh every 3 seconds
              setInterval(loadAnalysis, 3000);
          </script>
      </body>
      </html>
    `;
  }

  /**
   * Start the Express server
   */
  async start(): Promise<void> {
    // Initialize screenshot service
    await this.screenshotService.initialize();

    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`🚀 PixelPolish AI Agent running on port ${this.config.port}`);
        console.log(`📊 Dashboard: http://localhost:${this.config.port}`);
        console.log(`🏥 Health check: http://localhost:${this.config.port}/health`);
        console.log(`🔍 Analysis endpoint: POST http://localhost:${this.config.port}/analyze`);
        console.log(`📁 Local analysis: POST http://localhost:${this.config.port}/analyze-local`);
        console.log(`📂 Local files: http://localhost:${this.config.port}/local/`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    await this.screenshotService.close();
    console.log('🛑 Server stopped');
  }
} 