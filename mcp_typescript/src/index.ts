#!/usr/bin/env node
/**
 * PixelPolish MCP Server - UI Analysis Tools for AI Assistants
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { DOMCaptureService } from './dom-capture.js';
import { CSSExtractorService } from './css-extractor.js';
import { HeuristicsEngineService } from './heuristics-engine.js';
import { ScreenshotService } from './screenshot.js';
import { AIAnalyzer } from './analyzer.js';
import type { ComprehensiveAnalysis } from './types.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Shared state for API requests
interface ApiRequest {
  timestamp: number;
  data: any;
  headers: any;
}

class PixelPolishMCPServer {
  private server: Server;
  private domCapture: DOMCaptureService;
  private cssExtractor: CSSExtractorService;
  private heuristicsEngine: HeuristicsEngineService;
  private screenshotService: ScreenshotService;
  private aiAnalyzer: AIAnalyzer;
  private httpServer: any = null;
  private apiRequests: ApiRequest[] = []; // Queue for incoming API requests

  constructor() {
    this.server = new Server(
      {
        name: 'pixelpolish-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize services
    this.domCapture = new DOMCaptureService();
    this.cssExtractor = new CSSExtractorService();
    this.heuristicsEngine = new HeuristicsEngineService();
    
    // Get the directory of the current module and create screenshots path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const screenshotsPath = join(__dirname, '..', 'screenshots');
    
    this.screenshotService = new ScreenshotService(screenshotsPath);
    this.aiAnalyzer = new AIAnalyzer(process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai');

    this.setupToolHandlers();
  }

  private getContentType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  private parsePostData(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_url',
            description: 'Comprehensive UI analysis: DOM, CSS, heuristics, screenshots, AI assessment',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to analyze' },
                include_screenshot: { type: 'boolean', default: true },
                ai_provider: { type: 'string', enum: ['openai', 'anthropic'], default: 'openai' },
              },
              required: ['url'],
            },
          },
          {
            name: 'capture_screenshot',
            description: 'Take high-quality screenshot of any URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to screenshot' },
                filename: { type: 'string', default: 'screenshot' },
              },
              required: ['url'],
            },
          },
          {
            name: 'analyze_dom_structure',
            description: 'Extract and analyze DOM structure',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to analyze' },
              },
              required: ['url'],
            },
          },
          {
            name: 'run_heuristics_analysis',
            description: 'Run 190-point heuristics analysis',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to analyze' },
              },
              required: ['url'],
            },
          },
          {
            name: 'serve_vite_app',
            description: 'Serve the built UI Portal application from dist directory',
            inputSchema: {
              type: 'object',
              properties: {
                port: { type: 'number', description: 'Port to serve on', default: 8080 },
                dist_path: { type: 'string', description: 'Path to dist directory', default: './ui-portal/dist' },
                url: { type: 'string', description: 'URL to pass as query parameter (?url=...)' },
              },
              required: [],
            },
          },
          {
            name: 'stop_vite_app',
            description: 'Stop the running HTTP server',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'wait',
            description: 'Artificial wait tool that pauses execution for a specified duration',
            inputSchema: {
              type: 'object',
              properties: {
                duration_seconds: { type: 'number', description: 'Duration to wait in seconds', default: 50 },
                message: { type: 'string', description: 'Custom message to display while waiting', default: 'Waiting...' },
              },
              required: [],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_url':
            return await this.handleAnalyzeUrl(args);
          case 'capture_screenshot':
            return await this.handleCaptureScreenshot(args);
          case 'analyze_dom_structure':
            return await this.handleAnalyzeDomStructure(args);
          case 'run_heuristics_analysis':
            return await this.handleRunHeuristicsAnalysis(args);
          case 'serve_vite_app':
            return await this.handleServeViteApp(args);
          case 'stop_vite_app':
            return await this.handleStopViteApp(args);
          case 'wait':
            return await this.handleWait(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  private async handleAnalyzeUrl(args: any) {
    const { url, include_screenshot = true, ai_provider = 'openai' } = args;

    if (!url) {
      throw new McpError(ErrorCode.InvalidParams, 'URL is required');
    }

    console.error(`🔍 Starting analysis of: ${url}`);

    const domData = await this.domCapture.capture(url);
    const cssData = await this.cssExtractor.extract(domData.elements);
    const technicalAnalysis = await this.heuristicsEngine.analyze(domData, cssData);

    let screenshotResult = null;
    let visualAnalysis = null;

    if (include_screenshot) {
      await this.screenshotService.initialize();
      screenshotResult = await this.screenshotService.takeScreenshot(url, 'analysis');

      if (screenshotResult.success) {
        this.aiAnalyzer = new AIAnalyzer(ai_provider as 'openai' | 'anthropic');
        visualAnalysis = await this.aiAnalyzer.analyzeScreenshot(
          screenshotResult.screenshotBase64,
          { success: true, data: { dom: domData, css: cssData, analysis: technicalAnalysis } }
        );
      }
    }

    const combinedScore = visualAnalysis
      ? Math.round((technicalAnalysis.scorePercentage * 0.6) + (visualAnalysis.visual_score * 0.4))
      : technicalAnalysis.scorePercentage;

    const resultText = `# UI Analysis Results

**Combined Score: ${combinedScore}%**
- Technical: ${technicalAnalysis.scorePercentage}%
- Visual: ${visualAnalysis?.visual_score || 'N/A'}%

## Technical Analysis
- Elements: ${domData.totalElements}
- Issues: ${technicalAnalysis.issues.length}

### Rule Breakdown:
${technicalAnalysis.ruleResults.map(rule => 
  `- ${rule.ruleName}: ${rule.maxScore > 0 ? Math.round((rule.score / rule.maxScore) * 100) : 0}%`
).join('\n')}

### Top Issues:
${technicalAnalysis.issues.slice(0, 5).map((issue, i) => 
  `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`
).join('\n')}

${visualAnalysis ? `
## AI Visual Assessment
- Overall: ${visualAnalysis.visual_assessment.overall_quality}
- Color: ${visualAnalysis.visual_assessment.color_harmony}
- Layout: ${visualAnalysis.visual_assessment.layout_balance}
- Typography: ${visualAnalysis.visual_assessment.typography_consistency}
- Accessibility: ${visualAnalysis.visual_assessment.accessibility_score}%

### Priority Fixes:
${visualAnalysis.priority_fixes.slice(0, 3).map((fix, i) => 
  `${i + 1}. [${fix.priority.toUpperCase()}] ${fix.element}: ${fix.issue}
   Fix: ${fix.fix}
   ${fix.css_change ? `CSS: \`${fix.css_change}\`` : ''}`
).join('\n')}
` : ''}

### Recommendations:
${technicalAnalysis.recommendations.slice(0, 3).map((rec, i) => 
  `${i + 1}. ${rec.message}`
).join('\n')}
`;

    return { content: [{ type: "text", text: resultText }] };
  }

  private async handleCaptureScreenshot(args: any) {
    const { url, filename = 'screenshot' } = args;

    if (!url) {
      throw new McpError(ErrorCode.InvalidParams, 'URL is required');
    }

    await this.screenshotService.initialize();
    const result = await this.screenshotService.takeScreenshot(url, filename);

    const resultText = result.success 
      ? `Screenshot captured: ${result.filename}\nPath: ${result.screenshotPath}`
      : `Screenshot failed: ${result.error}`;

    return {
      content: [{ type: "text", text: resultText }],
      isError: !result.success
    };
  }

  private async handleAnalyzeDomStructure(args: any) {
    const { url } = args;

    if (!url) {
      throw new McpError(ErrorCode.InvalidParams, 'URL is required');
    }

    const domData = await this.domCapture.capture(url);

    const resultText = `# DOM Structure Analysis

**URL:** ${domData.url}
**Title:** ${domData.title}
**Elements:** ${domData.totalElements}

## Structure:
- Headings: ${domData.structure.headings.length}
- Navigation: ${domData.structure.navigation.length}
- Forms: ${domData.structure.forms.length}
- Images: ${domData.structure.images.length}
- Links: ${domData.structure.links.length}
`;

    return { content: [{ type: "text", text: resultText }] };
  }

  private async handleRunHeuristicsAnalysis(args: any) {
    const { url } = args;

    if (!url) {
      throw new McpError(ErrorCode.InvalidParams, 'URL is required');
    }

    const domData = await this.domCapture.capture(url);
    const cssData = await this.cssExtractor.extract(domData.elements);
    const analysis = await this.heuristicsEngine.analyze(domData, cssData);

    const resultText = `# 190-Point Heuristics Analysis

**Score: ${analysis.scorePercentage}%** (${analysis.score}/${analysis.maxScore} points)

## Rules:
${analysis.ruleResults.map(rule => {
  const percentage = rule.maxScore > 0 ? Math.round((rule.score / rule.maxScore) * 100) : 0;
  return `- ${rule.ruleName}: ${percentage}%`;
}).join('\n')}

## Issues (${analysis.issues.length}):
${analysis.issues.slice(0, 5).map((issue, i) => 
  `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`
).join('\n')}
`;

    return { content: [{ type: "text", text: resultText }] };
  }

  private async handleServeViteApp(args: any) {
    const { 
      port = 8080,
      dist_path = '../mcp_typescript/static_ui',
      url
    } = args;

    // Check if server is already running
    if (this.httpServer) {
      const serverPort = this.httpServer.address()?.port;
      return {
        content: [{ 
          type: "text", 
          text: `❌ HTTP server is already running on port ${serverPort}. Use stop_vite_app to stop it first.` 
        }]
      };
    }

    // Check if dist directory exists
    if (!existsSync(dist_path)) {
      throw new McpError(
        ErrorCode.InvalidParams, 
        `Dist directory not found: ${dist_path}. Make sure the UI Portal has been built.`
      );
    }

    // Check if index.html exists
    const indexPath = join(dist_path, 'index.html');
    if (!existsSync(indexPath)) {
      throw new McpError(
        ErrorCode.InvalidParams, 
        `index.html not found in: ${dist_path}. Make sure the build is complete.`
      );
    }

    try {
      console.error(`🚀 Starting HTTP server for UI Portal at: ${dist_path}`);

      // Create HTTP server
      this.httpServer = createServer(async (req, res) => {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        // Handle API submit endpoint
        if (req.url === '/api/submit' && req.method === 'POST') {
          try {
            const postData = await this.parsePostData(req);
            
            // Store the request in our queue
            const apiRequest: ApiRequest = {
              timestamp: Date.now(),
              data: postData,
              headers: req.headers
            };
            
            this.apiRequests.push(apiRequest);
            console.error(`📨 API request received: ${JSON.stringify(postData)}`);
            
            // Respond to the API call
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Request received and queued',
              timestamp: apiRequest.timestamp 
            }));
            return;
          } catch (error) {
            console.error('API submit error:', error);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(JSON.stringify({ 
              success: false, 
              error: 'Invalid JSON or request error' 
            }));
            return;
          }
        }

        // Remove query parameters first
        let filePath = (req.url || '/').split('?')[0];
        
        // If root path, serve index.html
        if (filePath === '/') {
          filePath = '/index.html';
        }
        
        // Security: prevent directory traversal
        if (filePath.includes('..')) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        const fullPath = join(dist_path, filePath);

        try {
          if (existsSync(fullPath)) {
            const content = readFileSync(fullPath);
            const contentType = this.getContentType(fullPath);
            
            res.setHeader('Content-Type', contentType);
            res.writeHead(200);
            res.end(content);
          } else {
            // For SPA routing, serve index.html for routes that don't exist
            const indexContent = readFileSync(indexPath);
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(indexContent);
          }
        } catch (fileError) {
          console.error('File read error:', fileError);
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });

      // Start listening
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(port, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      const serverUrl = `http://localhost:${port}`;
      console.error(`✅ Server started at ${serverUrl}`);

      // Automatically open the URL in the default browser
      try {
        console.error(`🌐 Opening ${serverUrl} in your default browser...`);
        
        // Use the appropriate command based on the platform
        let openCommand = '';
        const finalUrl = url ? `${serverUrl}?url=${encodeURIComponent(url)}` : serverUrl;
        
        if (process.platform === 'darwin') {
          openCommand = `open "${finalUrl}"`;
        } else if (process.platform === 'win32') {
          openCommand = `start "${finalUrl}"`;
        } else {
          // Linux and other Unix-like systems
          openCommand = `xdg-open "${finalUrl}"`;
        }
        
        await execAsync(openCommand);
        console.error(`✅ Browser opened successfully`);
      } catch (browserError) {
        console.error(`⚠️ Could not automatically open browser: ${browserError}`);
        console.error(`Please manually open: ${serverUrl}`);
      }

      const finalUrl = url ? `${serverUrl}?url=${encodeURIComponent(url)}` : serverUrl;
      const resultText = `✅ UI Portal is now serving and opened in your browser!

🌐 **Server URL:** ${serverUrl}
🔗 **Opened URL:** ${finalUrl}
📁 **Serving from:** ${dist_path}
⚡ **Port:** ${port}
📄 **Index file:** ${indexPath}
🚀 **Browser:** Automatically opened ${finalUrl}
${url ? `🎯 **Target URL:** ${url}` : ''}

The UI Portal application is now accessible and should have opened in your default browser.
CORS is enabled for development purposes.
SPA routing is supported - all routes will serve index.html.

**Quick Actions:**
- The browser should have automatically opened to ${finalUrl}
- If it didn't open, manually navigate to ${finalUrl}
- Use \`stop_vite_app\` tool to stop the server
- The server will serve all static assets from the dist directory`;

      return { content: [{ type: "text", text: resultText }] };

    } catch (error) {
      // Clean up on error
      if (this.httpServer) {
        this.httpServer.close();
        this.httpServer = null;
      }
      
      throw new McpError(
        ErrorCode.InternalError, 
        `Failed to start HTTP server: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async handleStopViteApp(args: any) {
    if (!this.httpServer) {
      return {
        content: [{ 
          type: "text", 
          text: `❌ No HTTP server is currently running.` 
        }]
      };
    }

    try {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          resolve();
        });
      });
      
      this.httpServer = null;
      
      return {
        content: [{ 
          type: "text", 
          text: `✅ HTTP server has been stopped.` 
        }]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError, 
        `Failed to stop HTTP server: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async handleWait(args: any) {
    const { duration_seconds = 5, message = 'Waiting...' } = args;

    console.error(`🕒 ${message} (checking for API requests for ${duration_seconds} seconds)`);
    
    // Clear any old requests before starting the wait
    this.apiRequests = [];
    
    const startTime = Date.now();
    const timeoutMs = duration_seconds * 1000;
    
    // Poll for API requests during the wait period
    while (Date.now() - startTime < timeoutMs) {
      // Check if any API requests have come in
      if (this.apiRequests.length > 0) {
        const request = this.apiRequests.shift(); // Get the first request
        console.error(`📨 API request found during wait period!`);
        
        return {
          content: [{ 
            type: "text", 
            text: `✅ API request received during wait period!\n\n**Request Data:**\n\`\`\`json\n${JSON.stringify(request.data, null, 2)}\n\`\`\`\n\n**Timestamp:** ${new Date(request.timestamp).toISOString()}\n**Wait Duration:** ${Math.round((Date.now() - startTime) / 1000)} seconds` 
          }],
          apiRequest: request // Include the raw request data for programmatic access
        };
      }
      
      // Wait 100ms before checking again
      await new Promise<void>(resolve => setTimeout(resolve, 100));
    }

    // No API requests received within timeout
    return {
      content: [{ 
        type: "text", 
        text: `⏰ Wait completed. Duration: ${duration_seconds} seconds. No API requests received.` 
      }]
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PixelPolish MCP Server running on stdio');
  }
}

const server = new PixelPolishMCPServer();
server.run().catch(console.error);
