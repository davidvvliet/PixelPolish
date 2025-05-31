#!/usr/bin/env node
/**
 * PixelPolish MCP AI Agent - TypeScript Implementation
 * 
 * Main entry point for the AI-powered UI analysis and fixing agent
 */

import { resolve } from 'path';
import type { PixelPolishConfig } from './types.js';
import { PixelPolishWatcher } from './watcher.js';

// Default configuration
const DEFAULT_CONFIG: PixelPolishConfig = {
  pixelpolishUrl: 'http://localhost:3002',
  localDir: '../local',
  screenshotsDir: './screenshots',
  watchInterval: 2000, // 2 seconds
  aiProvider: 'openai',
  autoFix: false // Start with false for safety
};

class PixelPolishMCP {
  private config: PixelPolishConfig;
  private watcher: PixelPolishWatcher;

  constructor(config: Partial<PixelPolishConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.watcher = new PixelPolishWatcher(this.config);
  }

  /**
   * Start the PixelPolish AI Agent
   */
  async start(): Promise<void> {
    console.log('🎨 PixelPolish AI Agent Starting...');
    console.log('📋 Configuration:');
    console.log(`   PixelPolish URL: ${this.config.pixelpolishUrl}`);
    console.log(`   Local Directory: ${resolve(this.config.localDir)}`);
    console.log(`   Screenshots: ${resolve(this.config.screenshotsDir)}`);
    console.log(`   AI Provider: ${this.config.aiProvider}`);
    console.log(`   Auto-fix: ${this.config.autoFix}`);
    console.log(`   Watch Interval: ${this.config.watchInterval}ms`);

    try {
      // Start file system watcher for local files
      this.watcher.startFileWatcher();

      // Start main analysis watcher
      await this.watcher.startWatching();

    } catch (error) {
      console.error('❌ Failed to start PixelPolish Agent:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    console.log('⏹️ Stopping PixelPolish AI Agent...');
    await this.watcher.stopWatching();
    console.log('✅ Agent stopped');
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: Partial<PixelPolishConfig> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--url':
        config.pixelpolishUrl = args[++i];
        break;
      case '--local-dir':
        config.localDir = args[++i];
        break;
      case '--ai-provider':
        const provider = args[++i];
        if (provider === 'openai' || provider === 'anthropic') {
          config.aiProvider = provider;
        }
        break;
      case '--auto-fix':
        config.autoFix = true;
        break;
      case '--no-auto-fix':
        config.autoFix = false;
        break;
      case '--interval':
        config.watchInterval = parseInt(args[++i]) || 2000;
        break;
      case '--test':
        await runTests();
        return;
      case '--help':
      case '-h':
        showHelp();
        return;
      default:
        if (arg.startsWith('-')) {
          console.error(`❌ Unknown option: ${arg}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  // Check for required environment variables
  if (config.aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found. AI analysis will use mock data.');
  }
  if (config.aiProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️ ANTHROPIC_API_KEY not found. AI analysis will use mock data.');
  }

  // Create and start the agent
  const agent = new PixelPolishMCP(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down...');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await agent.stop();
    process.exit(0);
  });

  // Start the agent
  await agent.start();
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
🎨 PixelPolish AI Agent - TypeScript MCP Server

USAGE:
  npm start [options]
  node dist/index.js [options]

OPTIONS:
  --url <url>              PixelPolish server URL (default: http://localhost:3002)
  --local-dir <path>       Local HTML files directory (default: ../local)
  --ai-provider <provider> AI provider: openai|anthropic (default: openai)
  --auto-fix               Enable automatic CSS/HTML fixes (default: disabled)
  --no-auto-fix            Disable automatic fixes
  --interval <ms>          Watch interval in milliseconds (default: 2000)
  --test                   Run connection tests
  --help, -h               Show this help

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY          OpenAI API key for GPT-4 Vision
  ANTHROPIC_API_KEY       Anthropic API key for Claude Vision

EXAMPLES:
  npm start                           # Start with default settings
  npm start -- --auto-fix             # Enable automatic fixes
  npm start -- --ai-provider anthropic # Use Claude instead of GPT-4
  npm start -- --url http://localhost:3000 --interval 5000

For more information, visit: https://github.com/your-repo/pixelpolish
`);
}

/**
 * Run connection and functionality tests
 */
async function runTests(): Promise<void> {
  console.log('🧪 Running PixelPolish Agent Tests...\n');

  const config = DEFAULT_CONFIG;
  const watcher = new PixelPolishWatcher(config);

  // Test 1: Server health check
  console.log('1. Testing PixelPolish server connection...');
  const serverHealthy = await watcher.checkServerHealth();
  console.log(`   ${serverHealthy ? '✅' : '❌'} Server health: ${serverHealthy ? 'OK' : 'FAILED'}`);

  // Test 2: Screenshot service
  console.log('\n2. Testing screenshot service...');
  try {
    const { ScreenshotService } = await import('./screenshot.js');
    const screenshotService = new ScreenshotService('./test-screenshots');
    await screenshotService.initialize();
    console.log('   ✅ Screenshot service: OK');
    await screenshotService.close();
  } catch (error) {
    console.log('   ❌ Screenshot service: FAILED');
    console.log(`      Error: ${error}`);
  }

  // Test 3: AI analyzer
  console.log('\n3. Testing AI analyzer...');
  try {
    const { AIAnalyzer } = await import('./analyzer.js');
    new AIAnalyzer('openai'); // Just test instantiation
    console.log('   ✅ AI analyzer: OK');
  } catch (error) {
    console.log('   ❌ AI analyzer: FAILED');
    console.log(`      Error: ${error}`);
  }

  console.log('\n🎯 Test Summary:');
  console.log(`   Server: ${serverHealthy ? 'PASS' : 'FAIL'}`);
  console.log('   Ready for operation: ' + (serverHealthy ? '✅' : '❌'));

  if (!serverHealthy) {
    console.log('\n💡 To fix server issues:');
    console.log('   1. Make sure PixelPolish server is running: npm start');
    console.log('   2. Check the server URL configuration');
  }
}

// Run the CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
} 