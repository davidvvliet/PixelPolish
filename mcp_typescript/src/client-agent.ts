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
    
    console.error(`👀 Starting file watcher on: ${watchPattern}`);

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
      console.error('\n🛑 Shutting down AI agent...');
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

    console.error(`📝 File ${changeType}: ${fileName}`);

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
        console.error('📄 No HTML files to analyze');
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
    console.error(`🔍 Starting analysis of: ${event.fileName}`);

    try {
      // Build local URL
      const localUrl = `http://localhost:${this.config.localServerPort}/${event.fileName}`;

      // Start MCP server if needed
      await this.ensureMCPServer();

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
   * 4. MCP CLIENT - Communicates with MCP server
   */
  private async ensureMCPServer(): Promise<void> {
    if (this.mcpProcess && !this.mcpProcess.killed) return;

    console.error('🤖 Starting MCP server...');

    this.mcpProcess = spawn('npm', ['start'], {
      cwd: resolve('.'),
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async callMCPAnalysis(url: string, filename: string): Promise<AnalysisResult> {
    if (!this.mcpProcess) {
      throw new Error('MCP server not running');
    }

    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'analyze_url',
          arguments: {
            url,
            include_screenshot: true,
            ai_provider: process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai'
          }
        }
      };

      let responseData = '';

      const timeout = setTimeout(() => {
        reject(new Error('MCP analysis timeout'));
      }, 30000);

      this.mcpProcess!.stdout!.on('data', (data) => {
        responseData += data.toString();
        
        try {
          const response = JSON.parse(responseData);
          clearTimeout(timeout);
          
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve({
              success: true,
              score: this.extractScore(response.result?.content?.[0]?.text),
              issues: this.extractIssues(response.result?.content?.[0]?.text),
              fixes: this.extractFixes(response.result?.content?.[0]?.text)
            });
          }
        } catch (e) {
          // Response might be incomplete, wait for more data
        }
      });

      this.mcpProcess!.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  private extractScore(text: string): number {
    const scoreMatch = text?.match(/Combined Score:\s*(\d+)%/);
    return scoreMatch ? parseInt(scoreMatch[1]) : 0;
  }

  private extractIssues(text: string): any[] {
    const issuesSection = text?.match(/### Top Issues:(.*?)(?=###|$)/s);
    if (!issuesSection) return [];

    return issuesSection[1]
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => ({
        description: line.trim(),
        severity: this.extractSeverity(line)
      }));
  }

  private extractFixes(text: string): any[] {
    const fixesSection = text?.match(/### Priority Fixes:(.*?)(?=###|$)/s);
    if (!fixesSection) return [];

    return fixesSection[1]
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => ({
        description: line.trim(),
        css: this.extractCSS(line),
        priority: this.extractPriority(line)
      }));
  }

  private extractSeverity(text: string): string {
    const match = text.match(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]/);
    return match ? match[1].toLowerCase() : 'medium';
  }

  private extractPriority(text: string): string {
    const match = text.match(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]/);
    return match ? match[1].toLowerCase() : 'medium';
  }

  private extractCSS(text: string): string {
    const match = text.match(/CSS:\s*`([^`]+)`/);
    return match ? match[1] : '';
  }

  /**
   * 5. RESPONSE HANDLER - Apply or show fixes
   */
  private async handleAnalysisResult(event: FileChangeEvent, result: AnalysisResult): Promise<void> {
    console.error(`📊 Analysis complete for ${event.fileName}:`);
    console.error(`   Score: ${result.score}%`);
    console.error(`   Issues: ${result.issues?.length || 0}`);
    console.error(`   Fixes: ${result.fixes?.length || 0}`);

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
      console.error(`💾 Analysis report saved: ${reportPath}`);

    } catch (error) {
      console.error('❌ Failed to save analysis report:', error);
    }
  }

  private displayAnalysisSummary(event: FileChangeEvent, result: AnalysisResult): void {
    console.error(`\n📋 === Analysis Summary for ${event.fileName} ===`);
    
    if (result.score !== undefined) {
      const scoreEmoji = result.score >= 80 ? '🟢' : result.score >= 60 ? '🟡' : '🔴';
      console.error(`${scoreEmoji} Overall Score: ${result.score}%`);
    }

    if (result.issues && result.issues.length > 0) {
      console.error(`\n🔍 Top Issues:`);
      result.issues.slice(0, 3).forEach((issue, i) => {
        console.error(`   ${i + 1}. ${issue.description}`);
      });
    }

    if (result.fixes && result.fixes.length > 0) {
      console.error(`\n🔧 Priority Fixes:`);
      result.fixes.slice(0, 3).forEach((fix, i) => {
        console.error(`   ${i + 1}. ${fix.description}`);
        if (fix.css) {
          console.error(`      CSS: ${fix.css}`);
        }
      });
    }

    console.error(`=======================================\n`);
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
    console.error(`🛠️  Applying ${fixes.length} automatic fixes to ${event.fileName}...`);

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
        
        console.error(`✅ Applied ${cssFixes.length} fixes to ${event.fileName}`);
        console.error(`💾 Backup saved as ${event.fileName}.backup`);
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

    console.error(`🌐 Starting local server on port ${this.config.localServerPort}...`);

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
      console.error('🛑 Local server stopped');
    }
  }

  private async stopMCPServer(): Promise<void> {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
      console.error('🛑 MCP server stopped');
    }
  }

  /**
   * Start the complete AI agent system
   */
  async start(): Promise<void> {
    console.error('🚀 Starting PixelPolish AI Agent...');
    console.error(`📂 Watching: ${this.config.watchDirectory}`);
    console.error(`💾 Output: ${this.config.outputDirectory}`);
    console.error(`🔧 Auto-fix: ${this.config.autoFix ? 'enabled' : 'disabled'}`);
    
    // Ensure directories exist
    if (!existsSync(this.config.watchDirectory)) {
      await mkdir(this.config.watchDirectory, { recursive: true });
      console.error(`📁 Created watch directory: ${this.config.watchDirectory}`);
    }

    if (!existsSync(this.config.outputDirectory)) {
      await mkdir(this.config.outputDirectory, { recursive: true });
      console.error(`📁 Created output directory: ${this.config.outputDirectory}`);
    }

    // Start all components
    this.startFileWatcher();
    
    console.error('✅ AI Agent is ready and watching for file changes!');
    console.error('📝 Edit any HTML, CSS, or JS files to trigger analysis...\n');
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
        console.error(`
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
  �� File Watcher       - Monitors HTML, CSS, JS files for changes
  🌐 Page Analyzer      - Launches local server and headless browser
  �� Heuristic Engine   - 190-point design quality scoring
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