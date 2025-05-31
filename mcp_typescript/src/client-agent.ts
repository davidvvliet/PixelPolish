#!/usr/bin/env node
/**
 * PixelPolish AI Agent Client
 * 
 * Complete file-watching system that:
 * 1. File Watcher - Detects changes to HTML/CSS/JS files
 * 2. Page Analyzer - Launches pages in headless browser
 * 3. Heuristic Engine - Detects visual/design problems
 * 4. MCP Client - Communicates with MCP server
 * 5. Response Handler - Applies or shows fixes
 */

import 'dotenv/config';
import chokidar from 'chokidar';
import { spawn, ChildProcess } from 'child_process';
import { join, resolve, extname } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

interface AnalysisConfig {
  watchDirectory: string;
  localServerPort: number;
  outputDirectory: string;
  autoFix: boolean;
  analysisDelay: number;
}

interface FileChangeEvent {
  filePath: string;
  fileName: string;
  fileType: string;
  timestamp: number;
  changeType: 'add' | 'change' | 'unlink';
}

interface AnalysisResult {
  success: boolean;
  score?: number;
  issues?: any[];
  fixes?: any[];
  screenshot?: string;
  error?: string;
}

class PixelPolishAIAgent {
  private config: AnalysisConfig;
  private mcpProcess: ChildProcess | null = null;
  private isAnalyzing = false;
  private analysisQueue: FileChangeEvent[] = [];
  private localServer: ChildProcess | null = null;

  constructor(config: Partial<AnalysisConfig> = {}) {
    this.config = {
      watchDirectory: resolve('./local'),
      localServerPort: 8080,
      outputDirectory: resolve('./analysis-results'),
      autoFix: false,
      analysisDelay: 1000,
      ...config
    };
  }

  /**
   * 1. FILE WATCHER - Detect changes to source files
   */
  private startFileWatcher(): void {
    const watchPattern = join(this.config.watchDirectory, '**/*.{html,css,js,jsx,ts,tsx}');
    
    console.log(`👀 Starting file watcher on: ${watchPattern}`);

    const watcher = chokidar.watch(watchPattern, {
      ignored: /node_modules|\.git|dist|build/,
      persistent: true,
      ignoreInitial: false
    });

    watcher
      .on('add', (path) => this.handleFileChange(path, 'add'))
      .on('change', (path) => this.handleFileChange(path, 'change'))
      .on('unlink', (path) => this.handleFileChange(path, 'unlink'))
      .on('error', (error) => console.error('👀 File watcher error:', error));

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down AI agent...');
      await watcher.close();
      await this.stopLocalServer();
      await this.stopMCPServer();
      process.exit(0);
    });
  }

  private async handleFileChange(filePath: string, changeType: 'add' | 'change' | 'unlink'): Promise<void> {
    const fileName = filePath.split('/').pop() || '';
    const fileType = extname(fileName).toLowerCase();

    // Only process relevant files
    if (!['.html', '.css', '.js', '.jsx', '.ts', '.tsx'].includes(fileType)) {
      return;
    }

    const event: FileChangeEvent = {
      filePath,
      fileName,
      fileType,
      timestamp: Date.now(),
      changeType
    };

    console.log(`📝 File ${changeType}: ${fileName}`);

    // Add to analysis queue
    this.analysisQueue.push(event);

    // Debounce analysis
    setTimeout(() => {
      if (!this.isAnalyzing) {
        this.processAnalysisQueue();
      }
    }, this.config.analysisDelay);
  }

  /**
   * 2. PAGE ANALYZER - Launch pages in headless browser
   */
  private async processAnalysisQueue(): Promise<void> {
    if (this.analysisQueue.length === 0 || this.isAnalyzing) return;

    this.isAnalyzing = true;
    const events = [...this.analysisQueue];
    this.analysisQueue = [];

    try {
      // Group by HTML files (main pages to analyze)
      const htmlFiles = events.filter(e => e.fileType === '.html' && e.changeType !== 'unlink');
      
      if (htmlFiles.length === 0) {
        console.log('📄 No HTML files to analyze');
        return;
      }

      // Start local server if needed
      await this.ensureLocalServer();

      // Analyze each HTML file
      for (const event of htmlFiles) {
        await this.analyzeFile(event);
      }

    } catch (error) {
      console.error('❌ Analysis queue processing failed:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async analyzeFile(event: FileChangeEvent): Promise<void> {
    console.log(`🔍 Starting analysis of: ${event.fileName}`);

    try {
      // Build local URL
      const localUrl = `http://localhost:${this.config.localServerPort}/${event.fileName}`;

      // Call MCP server for analysis
      const result = await this.callMCPAnalysis(localUrl, event.fileName);

      // Process results
      await this.handleAnalysisResult(event, result);

    } catch (error) {
      console.error(`❌ Analysis failed for ${event.fileName}:`, error);
    }
  }

  /**
   * 3. HEURISTIC ENGINE - Integrated via MCP server
   */
  
  /**
   * 4. MCP CLIENT - Direct analysis instead of MCP communication
   */
  private async callMCPAnalysis(url: string, filename: string): Promise<AnalysisResult> {
    console.log(`🔍 Starting analysis of: ${url}`);

    try {
      // Import analysis services directly
      const { DOMCaptureService } = await import('./dom-capture.js');
      const { CSSExtractorService } = await import('./css-extractor.js');
      const { HeuristicsEngineService } = await import('./heuristics-engine.js');
      const { ScreenshotService } = await import('./screenshot.js');
      const { AIAnalyzer } = await import('./analyzer.js');

      // Initialize services
      const domCapture = new DOMCaptureService();
      const cssExtractor = new CSSExtractorService();
      const heuristicsEngine = new HeuristicsEngineService();
      const screenshotService = new ScreenshotService('./screenshots');
      const aiAnalyzer = new AIAnalyzer(process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai');

      // Step 1: Capture DOM structure
      const domData = await domCapture.capture(url);

      // Step 2: Extract CSS patterns
      const cssData = await cssExtractor.extract(domData.elements);

      // Step 3: Run heuristics analysis
      const technicalAnalysis = await heuristicsEngine.analyze(domData, cssData);

      // Step 4: Take screenshot
      await screenshotService.initialize();
      const screenshotResult = await screenshotService.takeScreenshot(url, filename);

      let visualAnalysis = null;
      if (screenshotResult.success) {
        // Step 5: AI visual analysis
        visualAnalysis = await aiAnalyzer.analyzeScreenshot(
          screenshotResult.screenshotBase64,
          { success: true, data: { dom: domData, css: cssData, analysis: technicalAnalysis } }
        );
      }

      // Combine results
      const combinedScore = visualAnalysis
        ? Math.round((technicalAnalysis.scorePercentage * 0.6) + (visualAnalysis.visual_score * 0.4))
        : technicalAnalysis.scorePercentage;

      // Clean up
      await screenshotService.close();

      return {
        success: true,
        score: combinedScore,
        issues: technicalAnalysis.issues.map(issue => ({
          description: `[${issue.severity.toUpperCase()}] ${issue.message}`,
          severity: issue.severity
        })),
        fixes: visualAnalysis?.priority_fixes.map(fix => ({
          description: `[${fix.priority.toUpperCase()}] ${fix.element}: ${fix.issue}`,
          css: fix.css_change || '',
          priority: fix.priority
        })) || []
      };

    } catch (error) {
      console.error('❌ Direct analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  private async ensureMCPServer(): Promise<void> {
    // No longer needed - we call services directly
    return;
  }

  private async stopMCPServer(): Promise<void> {
    // No longer needed - we call services directly
    return;
  }

  /**
   * 5. RESPONSE HANDLER - Apply or show fixes
   */
  private async handleAnalysisResult(event: FileChangeEvent, result: AnalysisResult): Promise<void> {
    console.log(`📊 Analysis complete for ${event.fileName}:`);
    console.log(`   Score: ${result.score}%`);
    console.log(`   Issues: ${result.issues?.length || 0}`);
    console.log(`   Fixes: ${result.fixes?.length || 0}`);

    // Save detailed results
    await this.saveAnalysisReport(event, result);

    // Show summary
    this.displayAnalysisSummary(event, result);

    // Auto-apply fixes if enabled
    if (this.config.autoFix && result.fixes && result.fixes.length > 0) {
      await this.applyAutomaticFixes(event, result.fixes);
    }
  }

  private async saveAnalysisReport(event: FileChangeEvent, result: AnalysisResult): Promise<void> {
    try {
      // Ensure output directory exists
      if (!existsSync(this.config.outputDirectory)) {
        await mkdir(this.config.outputDirectory, { recursive: true });
      }

      const reportPath = join(
        this.config.outputDirectory,
        `${event.fileName}-${Date.now()}.json`
      );

      const report = {
        timestamp: new Date().toISOString(),
        file: event,
        analysis: result,
        recommendations: this.generateRecommendations(result)
      };

      await writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`💾 Analysis report saved: ${reportPath}`);

    } catch (error) {
      console.error('❌ Failed to save analysis report:', error);
    }
  }

  private displayAnalysisSummary(event: FileChangeEvent, result: AnalysisResult): void {
    console.log(`\n📋 === Analysis Summary for ${event.fileName} ===`);
    
    if (result.score !== undefined) {
      const scoreEmoji = result.score >= 80 ? '🟢' : result.score >= 60 ? '🟡' : '🔴';
      console.log(`${scoreEmoji} Overall Score: ${result.score}%`);
    }

    if (result.issues && result.issues.length > 0) {
      console.log(`\n🔍 Top Issues:`);
      result.issues.slice(0, 3).forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.description}`);
      });
    }

    if (result.fixes && result.fixes.length > 0) {
      console.log(`\n🔧 Priority Fixes:`);
      result.fixes.slice(0, 3).forEach((fix, i) => {
        console.log(`   ${i + 1}. ${fix.description}`);
        if (fix.css) {
          console.log(`      CSS: ${fix.css}`);
        }
      });
    }

    console.log(`=======================================\n`);
  }

  private generateRecommendations(result: AnalysisResult): string[] {
    const recommendations: string[] = [];

    if (result.score !== undefined) {
      if (result.score < 60) {
        recommendations.push('Consider a comprehensive design review');
        recommendations.push('Focus on accessibility and spacing consistency');
      } else if (result.score < 80) {
        recommendations.push('Address high-priority visual issues');
        recommendations.push('Improve color harmony and typography');
      } else {
        recommendations.push('Fine-tune remaining minor issues');
        recommendations.push('Consider advanced responsive optimizations');
      }
    }

    return recommendations;
  }

  private async applyAutomaticFixes(event: FileChangeEvent, fixes: any[]): Promise<void> {
    console.log(`🛠️  Applying ${fixes.length} automatic fixes to ${event.fileName}...`);

    try {
      const filePath = event.filePath;
      const content = await readFile(filePath, 'utf8');
      let modifiedContent = content;

      // Apply CSS fixes
      const cssFixes = fixes.filter(fix => fix.css && fix.priority === 'critical');
      
      for (const fix of cssFixes) {
        // Simple CSS injection (could be more sophisticated)
        if (modifiedContent.includes('</head>')) {
          const styleTag = `\n<style>\n/* Auto-fix: ${fix.description} */\n${fix.css}\n</style>\n`;
          modifiedContent = modifiedContent.replace('</head>', `${styleTag}</head>`);
        }
      }

      if (modifiedContent !== content) {
        // Backup original
        await writeFile(`${filePath}.backup`, content);
        
        // Write modified content
        await writeFile(filePath, modifiedContent);
        
        console.log(`✅ Applied ${cssFixes.length} fixes to ${event.fileName}`);
        console.log(`💾 Backup saved as ${event.fileName}.backup`);
      }

    } catch (error) {
      console.error(`❌ Failed to apply fixes to ${event.fileName}:`, error);
    }
  }

  /**
   * Utility: Local file server for testing
   */
  private async ensureLocalServer(): Promise<void> {
    if (this.localServer && !this.localServer.killed) return;

    console.log(`🌐 Starting local server on port ${this.config.localServerPort}...`);

    this.localServer = spawn('npx', ['http-server', this.config.watchDirectory, '-p', this.config.localServerPort.toString(), '--silent'], {
      stdio: 'inherit'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async stopLocalServer(): Promise<void> {
    if (this.localServer) {
      this.localServer.kill();
      this.localServer = null;
      console.log('🛑 Local server stopped');
    }
  }

  /**
   * Start the complete AI agent system
   */
  async start(): Promise<void> {
    console.log('🚀 Starting PixelPolish AI Agent...');
    console.log(`📂 Watching: ${this.config.watchDirectory}`);
    console.log(`💾 Output: ${this.config.outputDirectory}`);
    console.log(`🔧 Auto-fix: ${this.config.autoFix ? 'enabled' : 'disabled'}`);
    
    // Ensure directories exist
    if (!existsSync(this.config.watchDirectory)) {
      await mkdir(this.config.watchDirectory, { recursive: true });
      console.log(`📁 Created watch directory: ${this.config.watchDirectory}`);
    }

    if (!existsSync(this.config.outputDirectory)) {
      await mkdir(this.config.outputDirectory, { recursive: true });
      console.log(`📁 Created output directory: ${this.config.outputDirectory}`);
    }

    // Start all components
    this.startFileWatcher();
    
    console.log('✅ AI Agent is ready and watching for file changes!');
    console.log('📝 Edit any HTML, CSS, or JS files to trigger analysis...\n');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const config: Partial<AnalysisConfig> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--watch-dir':
        config.watchDirectory = resolve(args[++i]);
        break;
      case '--output-dir':
        config.outputDirectory = resolve(args[++i]);
        break;
      case '--port':
        config.localServerPort = parseInt(args[++i]);
        break;
      case '--auto-fix':
        config.autoFix = true;
        break;
      case '--delay':
        config.analysisDelay = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
PixelPolish AI Agent - Complete File Watching & Analysis System

Usage: node dist/client-agent.js [options]

Options:
  --watch-dir <path>    Directory to watch for changes (default: ./local)
  --output-dir <path>   Directory for analysis reports (default: ./analysis-results)
  --port <number>       Local server port (default: 8080)
  --auto-fix            Enable automatic fix application
  --delay <ms>          Analysis delay after file changes (default: 1000)
  --help                Show this help message

Features:
  🔍 File Watcher       - Monitors HTML, CSS, JS files for changes
  🌐 Page Analyzer      - Launches local server and headless browser
  📊 Heuristic Engine   - 190-point design quality scoring
  🤖 MCP Integration    - Communicates with MCP server for AI analysis
  🔧 Response Handler   - Saves reports and optionally applies fixes

Environment Variables:
  OPENAI_API_KEY        - For GPT-4 Vision analysis
  ANTHROPIC_API_KEY     - For Claude Vision analysis
        `);
        process.exit(0);
    }
  }

  const agent = new PixelPolishAIAgent(config);
  agent.start().catch(console.error);
}

export { PixelPolishAIAgent, type AnalysisConfig, type AnalysisResult }; 