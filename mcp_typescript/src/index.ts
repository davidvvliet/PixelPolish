#!/usr/bin/env node
/**
 * PixelPolish Comprehensive AI Agent - MCP Server Implementation
 * 
 * Main entry point for the MCP-compatible AI-powered UI analysis agent.
 */

import { resolve } from 'path';
import type { PixelPolishConfig, ComprehensiveAnalysis } from './types.js';
import { PixelPolishServer } from './server.js'; // Will be used by the agent
import { PixelPolishWatcher } from './watcher.js'; // May not be directly used by MCP server initially

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Default configuration (can be overridden by env vars or MCP config)
const DEFAULT_CONFIG: PixelPolishConfig = {
  port: 3002, // Port for the internal Express server if still used for dashboard/local file serving
  localDir: resolve(process.env.MCP_LOCAL_DIR || '../local'),
  screenshotsDir: resolve(process.env.MCP_SCREENSHOTS_DIR || './screenshots'),
  watchInterval: 3000,
  aiProvider: (process.env.AI_PROVIDER === 'openai' || process.env.AI_PROVIDER === 'anthropic') ? process.env.AI_PROVIDER : 'openai',
  autoFix: process.env.AUTO_FIX === 'true' // Start with false for safety
};

class PixelPolishAIAgentInternal {
  private config: PixelPolishConfig;
  // The Express server might still be useful for serving local files for analysis or a dashboard.
  // If not, this can be refactored further.
  public expressServer: PixelPolishServer; // Made public
  // Watcher might be a separate tool or feature later if needed.
  // private watcher: PixelPolishWatcher | null = null;

  constructor(config: Partial<PixelPolishConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // The PixelPolishServer (Express) might still be needed if we want to serve local files
    // via HTTP for analysis, or if a dashboard is maintained.
    // For MCP, the primary interaction is via tools.
    this.expressServer = new PixelPolishServer(this.config);
  }

  /**
   * Initializes services required for analysis (like screenshot service).
   * This is crucial as the MCP server is long-running.
   */
  async initializeServices(): Promise<void> {
    // The original PixelPolishServer's start method initializes screenshotService.
    // We need to ensure this happens.
    await this.expressServer.initializeScreenshotService(); // Assuming this method exists or is refactored
    console.log('🎨 PixelPolish services initialized.');
  }
  
  /**
   * Perform comprehensive analysis using the existing logic.
   * This method will be called by the MCP tool.
   */
  async performComprehensiveAnalysis(url: string, filename?: string): Promise<ComprehensiveAnalysis> {
    // This reuses the logic from the original PixelPolishServer class
    return this.expressServer.performComprehensiveAnalysis(url, filename);
  }

  /**
   * Gets the config.
   */
  getConfig(): PixelPolishConfig {
    return this.config;
  }

  /**
   * Stops services.
   */
  async stopServices(): Promise<void> {
    await this.expressServer.stopScreenshotService(); // Assuming this method exists
    console.log('🛑 PixelPolish services stopped.');
  }
}

/**
 * Main MCP Server function
 */
async function mainMcp(): Promise<void> {
  console.log('🤖 PixelPolish AI Agent - MCP Server starting...');

  // Environment variables for API keys should be checked.
  // The MCP server configuration will pass these.
  if (DEFAULT_CONFIG.aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found in env. AI analysis might fail or use mock data.');
  }
  if (DEFAULT_CONFIG.aiProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️ ANTHROPIC_API_KEY not found in env. AI analysis might fail or use mock data.');
  }

  const agentInternal = new PixelPolishAIAgentInternal(DEFAULT_CONFIG);
  await agentInternal.initializeServices();

  // Start the internal Express server to serve local files and potentially the dashboard
  try {
    console.log('🚀 Starting internal Express server for local file serving...');
    // The start method of PixelPolishServer also initializes the screenshot service,
    // which is fine if initializeScreenshotService is idempotent.
    await agentInternal.expressServer.start();
    console.log('✅ Internal Express server started.');
  } catch (error) {
    console.error('❌ Failed to start internal Express server:', error);
    // Decide if this is a fatal error for the MCP server
    // For now, we'll let the MCP server continue, but local analysis might fail.
  }

  const mcpServer = new McpServer({
    name: "pixelpolish-ai-agent", // From package.json
    version: "2.0.0" // From package.json
  });

  // Define the core analysis tool
  mcpServer.tool(
    "perform_comprehensive_analysis",
    {
      url: z.string().describe("The URL of the page/file to analyze. For local files, construct a file:// URL or use the analyze_local_file tool."),
      filename: z.string().optional().describe("Optional filename, used for naming screenshots and reports if the URL is not descriptive (e.g., local file paths).")
    },
    async ({ url, filename }) => {
      try {
        console.log(`MCP Tool: perform_comprehensive_analysis called for URL: ${url}`);
        const analysisResult = await agentInternal.performComprehensiveAnalysis(url, filename);
        return {
          content: [
            {
              type: "text",
              // MCP tool results should be structured data, JSON is good.
              text: JSON.stringify(analysisResult, null, 2), 
            },
          ],
        };
      } catch (error) {
        console.error('MCP Tool Error - perform_comprehensive_analysis:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error during analysis: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  mcpServer.tool(
    "analyze_local_file",
    {
      filename: z.string().describe("The name of the HTML file in the configured 'localDir' to analyze."),
    },
    async ({ filename }) => {
      try {
        const config = agentInternal.getConfig();
        // The PixelPolishServer is already configured to serve from localDir on a specific port.
        // We need to ensure this server is running or its relevant parts are accessible.
        // For simplicity, we'll assume the express server part of PixelPolishServer can be started
        // or its file serving logic can be used.
        // This might require starting the internal Express server if it's not already running.
        // For now, let's assume the local file URL construction logic from PixelPolishServer can be used.
        
        // This logic was in PixelPolishServer:
        // const localUrl = `http://localhost:${this.config.port}/local/${filename}?t=${Date.now()}`;
        // To make this work, the internal Express server needs to be running.
        // This is a slight architectural challenge: MCP server is stdio, Express is HTTP.
        // One option: The MCP server could *start* the Express server on a known port.
        // For now, let's construct a file:// URL, assuming DOMCaptureService can handle it.
        // Or, better, reuse the existing logic that expects an HTTP URL for local files.
        // This implies the internal Express server *must* be running.
        
        // Let's ensure the internal Express server is started by the MCP process.
        // This is not ideal for a pure stdio MCP server but matches current PixelPolishServer design.
        // A cleaner way would be for DOMCaptureService to directly read local files.
        
        // For now, we'll rely on the existing HTTP endpoint of the internal server.
        // The internal server needs to be started.
        // This is a temporary measure. Ideally, analysis logic shouldn't depend on a running HTTP server
        // if the MCP server itself is stdio.
        
        // Let's assume the internal express server is started by initializeServices or similar.
        // The original server.ts starts an HTTP server. We need to ensure that happens.
        // The `PixelPolishServer` class has a `start` method.
        // We could call `agentInternal.expressServer.start()` but that's async and might conflict.

        // Simplification: Assume `performComprehensiveAnalysis` can handle `file:///` URLs
        // or the `DOMCaptureService` is updated to do so.
        // For now, we'll stick to the original design which used an HTTP URL for local files.
        // This means the internal Express server needs to be running.
        // The `initializeServices` could potentially start it.
        // Let's modify `PixelPolishServer` to allow starting without blocking, or make `performComprehensiveAnalysis`
        // more flexible with local paths.

        // Given the current structure of PixelPolishServer, it expects to serve local files over HTTP.
        // We will use the `analyze-local` endpoint logic from `PixelPolishServer`
        const localUrl = `http://localhost:${agentInternal.getConfig().port}/local/${filename}?t=${Date.now()}`;
        console.log(`MCP Tool: analyze_local_file called for filename: ${filename}, URL: ${localUrl}`);

        const analysisResult = await agentInternal.performComprehensiveAnalysis(localUrl, filename);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analysisResult, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error('MCP Tool Error - analyze_local_file:', error);
        return {
          content: [
            {
              type: "text",
              text: `Error during local file analysis: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Graceful shutdown for MCP server
  const shutdown = async () => {
    console.log('\n👋 Shutting down PixelPolish MCP server...');
    await agentInternal.stopServices();
    // McpServer doesn't have an explicit stop, transport handles it.
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('✅ PixelPolish AI Agent MCP Server running on stdio. Ready for commands.');
  // console.error is used for logs that shouldn't interfere with stdio JSON communication.
}

// Run the MCP server main function
// Correctly check if the module is the main module
const currentFileUrl = import.meta.url;
// Ensure process.argv[1] is correctly accessed for the main module path
const mainModulePath = `file://${process.argv[1]}`;

if (currentFileUrl === mainModulePath) {
  mainMcp().catch(error => {
    console.error('❌ Fatal MCP error:', error);
    process.exit(1);
  });
}