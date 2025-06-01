# PixelPolish - UI Analysis MCP Server

**Comprehensive UI Analysis Tools for AI Assistants**

This project provides a powerful MCP (Model Context Protocol) server that gives AI assistants comprehensive UI analysis capabilities, along with a visual DOM manipulation portal for interactive demonstrations.

## Quick Start

### MCP Server
```bash
cd mcp_typescript
npm install
npx playwright install chromium
npm run build
npm start
```

### UI Portal
```bash
cd ui-portal
npm install
npm run build
npm run dev
```

## What's Included

### MCP Server (`mcp_typescript/`)
The MCP server provides AI assistants with:

- **DOM Structure Analysis** - Puppeteer-based element extraction
- **CSS Pattern Detection** - Layout, spacing, typography analysis  
- **190-Point Heuristics** - Comprehensive scoring system
- **Screenshot Capture** - Playwright visual capture
- **AI Visual Assessment** - GPT-4V/Claude integration
- **Automated Fix Generation** - Priority CSS/HTML improvements

### UI Portal (`ui-portal/`)
A modern web interface that demonstrates DOM manipulation capabilities:

- **Interactive Control Panel** - Quick actions and style manipulation tools
- **Real-time Website Preview** - Live iframe display of target websites
- **Text and Style Controls** - Dynamic content modification interface
- **Professional Design** - Clean light-mode interface with PixelPolish branding

## Project Structure

```
PixelPolish/
├── mcp_typescript/          # MCP Server (MAIN)
│   ├── src/                 # TypeScript source code
│   ├── package.json         # Dependencies and scripts
│   ├── tsconfig.json        # TypeScript configuration
│   └── README.md            # Detailed MCP documentation
├── ui-portal/               # DOM Manipulation Portal
│   ├── src/                 # Vite-based web application
│   ├── dist/                # Built application
│   ├── package.json         # Portal dependencies
│   └── index.html           # Main HTML file
├── local/                   # HTML files for testing
├── web-ui/                  # Legacy web interface
├── .git/                    # Version control
└── .gitignore               # Git ignore rules
```

## MCP Tools Available

When connected to an AI assistant, provides these tools:

- **`analyze_url`** - Comprehensive UI analysis with technical + AI scoring
- **`capture_screenshot`** - High-quality screenshot capture
- **`analyze_dom_structure`** - DOM element extraction and analysis
- **`run_heuristics_analysis`** - 190-point technical scoring

## Key Features

### AI-Powered Analysis
- **Technical Score:** 190-point heuristics across 6 rule categories
- **Visual Score:** AI assessment using GPT-4V or Claude Vision
- **Combined Scoring:** Technical (60%) + Visual (40%) methodology
- **Priority Fixes:** Actionable CSS/HTML improvements with code

### Real-time Processing
- Screenshot capture with cache-busting
- DOM analysis with computed styles
- CSS pattern extraction and consistency checking
- Issue classification by severity

### Interactive Portal
- Modern Vite-based web application
- Real-time DOM manipulation demonstrations
- Professional UI with PixelPolish branding
- Cross-origin considerations for security

### Integration Ready
- MCP protocol for AI assistant integration
- Environment variable configuration
- TypeScript with full type safety
- Production-ready architecture

## Full Documentation

See `mcp_typescript/README.md` for:
- Complete tool documentation
- API reference and parameters
- Development and customization guide
- Architecture overview

## Architecture Evolution

This project evolved from a split Express server system to a **unified MCP server** that provides:

- **AI Assistant Integration** - Direct tool access via MCP protocol
- **Comprehensive Analysis** - Technical + visual assessment combined
- **Real-time Processing** - Immediate analysis results
- **Simplified Deployment** - Single MCP server handles everything
- **Interactive Demonstrations** - Visual portal for showcasing capabilities

## Environment Variables

```bash
# For AI visual analysis (optional)
OPENAI_API_KEY=sk-...           # For GPT-4 Vision
ANTHROPIC_API_KEY=sk-ant-...    # For Claude Vision
```

## Development

### MCP Server Development
```bash
cd mcp_typescript
npm run dev
```

### UI Portal Development
```bash
cd ui-portal
npm run dev
```

Access the portal at `http://localhost:5173`

---

**Ready to enhance AI assistants with comprehensive UI analysis capabilities!**

*Head to `mcp_typescript/` for the complete MCP server implementation.*
*Visit `ui-portal/` for the interactive DOM manipulation demonstration.*

