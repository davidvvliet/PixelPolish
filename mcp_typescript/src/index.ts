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

class PixelPolishMCPServer {
  private server: Server;
  private domCapture: DOMCaptureService;
  private cssExtractor: CSSExtractorService;
  private heuristicsEngine: HeuristicsEngineService;
  private screenshotService: ScreenshotService;
  private aiAnalyzer: AIAnalyzer;
  private httpServer: any = null;

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
            description: 'Builds the user\'s Vite application and serves its index.html with injected DOM/tree editing tools.',
            inputSchema: {
              type: 'object',
              properties: {
                user_project_path: { type: 'string', description: 'Optional. Path to the user\'s Vite project root directory. Defaults to current working directory if not provided.' },
                user_build_command: { type: 'string', description: 'Optional. The command to build the user\'s Vite project.', default: 'npm run build'},
                port: { type: 'number', description: 'Port to serve the application with editing tools on', default: 8080 }
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
    let {
      user_project_path,
      user_build_command = 'npm run build',
      port = 8080
    } = args;

    if (!user_project_path) {
      user_project_path = process.cwd();
    }

    if (this.httpServer) {
      const serverPort = this.httpServer.address()?.port;
      return {
        content: [{ type: "text", text: `❌ HTTP server is already running on port ${serverPort}. Use stop_vite_app to stop it first.` }]
      };
    }

    try {
      // 1. Build User's Application
      console.error(`🚀 Starting build for user's project at: ${user_project_path} using command: "${user_build_command}"`);
      await new Promise<void>((resolve, reject) => {
        exec(user_build_command, { cwd: user_project_path }, (error, stdout, stderr) => {
          if (error) {
            console.error(`User project build error: ${error.message}`);
            reject(new McpError(ErrorCode.InternalError, `User project build failed: ${error.message}\nStderr: ${stderr}`));
            return;
          }
          console.log(`User project build stdout: ${stdout}`);
          if (stderr) console.warn(`User project build stderr: ${stderr}`);
          resolve();
        });
      });
      console.error(`✅ User project build successful at: ${user_project_path}`);

      const user_dist_path = join(user_project_path, 'dist');
      const user_indexPath = join(user_dist_path, 'index.html');

      if (!existsSync(user_dist_path)) {
        throw new McpError(ErrorCode.InternalError, `User dist directory not found at ${user_dist_path} after build.`);
      }
      if (!existsSync(user_indexPath)) {
        throw new McpError(ErrorCode.InternalError, `User index.html not found in ${user_dist_path} after build.`);
      }

      // 2. Prepare Tools UI Snippet (Placeholder)
      const toolsUiSnippet = `
        <div id="roos-editing-tools-container" style="position: fixed; bottom: 0; left: 0; width: 100%; background-color: rgba(240, 240, 240, 0.9); border-top: 1px solid #ccc; padding: 10px; box-sizing: border-box; z-index: 10000; display: flex; flex-direction: column; gap: 5px; max-height: 200px; overflow-y: auto;">
          <h4 style="margin: 0 0 5px 0; text-align: center;">Live Editing Tools (DOM)</h4>
          <button onclick="console.log('Attempting to select an element...'); alert('Element selection not yet implemented.');" style="padding: 5px;">Select Element</button>
          <button onclick="alert(document.documentElement.outerHTML);" style="padding: 5px;">Show Full DOM HTML</button>
          <p style="font-size: 0.8em; text-align: center; margin: 5px 0 0 0;">Changes made here are temporary to the DOM.</p>
        </div>
        <script>
          console.log("Roo's Editing Tools UI Injected!");
          // Future: Add more sophisticated JS for tool interaction here.
          // For example, to communicate changes back or interact with an iframe.
        </script>
      `;

      // 3. Read and Inject Tools UI into User's index.html
      let userIndexHtmlContent = readFileSync(user_indexPath, 'utf-8');
      userIndexHtmlContent = userIndexHtmlContent.replace('</body>', `${toolsUiSnippet}</body>`);
      
      console.error(`🚀 Starting HTTP server for modified user application at: ${user_dist_path}`);

      this.httpServer = createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        let reqFilePath = req.url === '/' ? '/index.html' : req.url || '/index.html';
        reqFilePath = reqFilePath.split('?')[0];

        if (reqFilePath.includes('..')) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        
        const fullPath = join(user_dist_path, reqFilePath);

        // Serve modified index.html for root or index.html requests
        if (reqFilePath === '/index.html') {
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.end(userIndexHtmlContent);
        } else if (existsSync(fullPath)) { // Serve other static assets as is
          const content = readFileSync(fullPath);
          const contentType = this.getContentType(fullPath);
          res.setHeader('Content-Type', contentType);
          res.writeHead(200);
          res.end(content);
        } else { // For SPA routing, serve modified index.html
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.end(userIndexHtmlContent);
        }
      });

      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(port, (err: any) => {
          if (err) reject(err); else resolve();
        });
      });

      const serverUrl = `http://localhost:${port}`;
      console.error(`✅ Modified user application server started at ${serverUrl}`);

      const resultText = `✅ User's application (with injected editing tools) is now serving!
🌐 **Server URL:** ${serverUrl}
📁 **Serving from (user's dist):** ${user_dist_path}
⚡ **Port:** ${port}
🛠️ **Editing Tools:** Injected into the page.

The user's application is now accessible in your browser with temporary DOM editing tools.`;
      return { content: [{ type: "text", text: resultText }] };

    } catch (error) {
      if (this.httpServer) {
        this.httpServer.close();
        this.httpServer = null;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new McpError(ErrorCode.InternalError, `Failed to start HTTP server: ${errorMessage}`);
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PixelPolish MCP Server running on stdio');
  }
}

const server = new PixelPolishMCPServer();
server.run().catch(console.error);
