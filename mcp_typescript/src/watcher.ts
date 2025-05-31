/**
 * File watcher service that monitors PixelPolish server for changes
 */

import chokidar from 'chokidar';
import fetch from 'node-fetch';
import { join } from 'path';
import type { AnalysisData, PixelPolishConfig } from './types.js';
import { ScreenshotService } from './screenshot.js';
import { AIAnalyzer } from './analyzer.js';

export class PixelPolishWatcher {
  private config: PixelPolishConfig;
  private screenshotService: ScreenshotService;
  private aiAnalyzer: AIAnalyzer;
  private lastAnalysisTime: string | null = null;
  private isRunning = false;

  constructor(config: PixelPolishConfig) {
    this.config = config;
    this.screenshotService = new ScreenshotService(config.screenshotsDir);
    this.aiAnalyzer = new AIAnalyzer(config.aiProvider);
  }

  /**
   * Check if PixelPolish server is running
   */
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.pixelpolishUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      return false;
    }
  }

  /**
   * Get the latest analysis from PixelPolish dashboard
   */
  async getLatestAnalysis(): Promise<AnalysisData | null> {
    try {
      const response = await fetch(`${this.config.pixelpolishUrl}/dashboard`);
      if (response.ok) {
        const data = await response.json() as AnalysisData;
        if (data.success) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get analysis:', error);
      return null;
    }
  }

  /**
   * Process a new analysis: take screenshot and run AI analysis
   */
  async processNewAnalysis(analysis: AnalysisData): Promise<void> {
    if (!analysis.filename) {
      console.warn('⚠️ Analysis has no filename, skipping');
      return;
    }

    console.log(`🔍 Processing new analysis for: ${analysis.filename}`);

    // Take screenshot
    const localUrl = `${this.config.pixelpolishUrl}/local/${analysis.filename}`;
    const screenshotResult = await this.screenshotService.takeScreenshot(localUrl, analysis.filename);

    if (!screenshotResult.success) {
      console.error('❌ Failed to take screenshot');
      return;
    }

    // Run AI analysis
    const aiAnalysis = await this.aiAnalyzer.analyzeScreenshot(
      screenshotResult.screenshotBase64,
      analysis
    );

    // Log AI results
    console.log('🤖 AI Analysis Results:');
    console.log(`   Visual Score: ${aiAnalysis.visual_score}%`);
    console.log(`   Technical Score: ${aiAnalysis.technical_score}%`);
    console.log(`   Priority Fixes: ${aiAnalysis.priority_fixes.length}`);

    if (aiAnalysis.priority_fixes.length > 0) {
      console.log('🔧 Priority Fixes:');
      aiAnalysis.priority_fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. [${fix.priority.toUpperCase()}] ${fix.element}: ${fix.issue}`);
      });
    }

    // Apply fixes if auto-fix is enabled
    if (this.config.autoFix && aiAnalysis.priority_fixes.length > 0) {
      const highPriorityFixes = aiAnalysis.priority_fixes.filter(
        fix => fix.priority === 'critical' || fix.priority === 'high'
      );

      if (highPriorityFixes.length > 0) {
        console.log(`🛠️ Auto-applying ${highPriorityFixes.length} high-priority fixes...`);
        await this.applyFixes(analysis.filename, highPriorityFixes);
      }
    }
  }

  /**
   * Apply automated fixes to the HTML/CSS file
   */
  async applyFixes(filename: string, fixes: any[]): Promise<boolean> {
    try {
      // For now, just log what would be applied
      // In the future, this would parse and modify the HTML/CSS files
      console.log(`📝 Would apply ${fixes.length} fixes to ${filename}:`);
      
      fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. [${fix.priority}] ${fix.element}: ${fix.issue}`);
        if (fix.css_change) {
          console.log(`      CSS: ${fix.css_change}`);
        }
        if (fix.html_change) {
          console.log(`      HTML: ${fix.html_change}`);
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to apply fixes:', error);
      return false;
    }
  }

  /**
   * Start watching for changes
   */
  async startWatching(): Promise<void> {
    console.log('🚀 Starting PixelPolish AI Watcher...');

    // Check server health
    if (!(await this.checkServerHealth())) {
      console.error('❌ PixelPolish server is not running. Start it with: npm start');
      return;
    }

    console.log('✅ PixelPolish server is running');

    // Initialize screenshot service
    await this.screenshotService.initialize();

    this.isRunning = true;

    // Main watch loop
    while (this.isRunning) {
      try {
        const analysis = await this.getLatestAnalysis();

        if (analysis && analysis.analyzedAt !== this.lastAnalysisTime) {
          console.log(`🔔 New analysis detected at ${analysis.analyzedAt}`);
          await this.processNewAnalysis(analysis);
          this.lastAnalysisTime = analysis.analyzedAt || null;
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, this.config.watchInterval));

      } catch (error) {
        console.error('❌ Watcher error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s on error
      }
    }
  }

  /**
   * Stop watching
   */
  async stopWatching(): Promise<void> {
    console.log('⏹️ Stopping watcher...');
    this.isRunning = false;
    await this.screenshotService.close();
    console.log('✅ Watcher stopped');
  }

  /**
   * Start file system watcher for local directory
   */
  startFileWatcher(): void {
    const localPath = join(this.config.localDir, '*.html');
    
    console.log(`👀 Watching files: ${localPath}`);

    const watcher = chokidar.watch(localPath, {
      ignored: /^\./, 
      persistent: true,
      ignoreInitial: false
    });

    watcher
      .on('add', path => console.log(`📁 File added: ${path}`))
      .on('change', path => {
        console.log(`📝 File changed: ${path}`);
        // File change will trigger analysis via the main server,
        // which we'll pick up in the main watch loop
      })
      .on('unlink', path => console.log(`🗑️ File removed: ${path}`))
      .on('error', error => console.error('👀 File watcher error:', error));

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n👋 Shutting down...');
      await watcher.close();
      await this.stopWatching();
      process.exit(0);
    });
  }
} 