# PixelPolish - UI Analysis MCP Server

**🤖 Comprehensive UI Analysis Tools for AI Assistants**

This project provides a powerful MCP (Model Context Protocol) server that gives AI assistants comprehensive UI analysis capabilities.

## 🚀 Quick Start

```bash
cd mcp_typescript
npm install
npx playwright install chromium
npm run build
npm start
```

## ✨ What's Included

The MCP server in `mcp_typescript/` provides AI assistants with:

- **🔍 DOM Structure Analysis** - Puppeteer-based element extraction
- **🎨 CSS Pattern Detection** - Layout, spacing, typography analysis  
- **📊 190-Point Heuristics** - Comprehensive scoring system
- **📸 Screenshot Capture** - Playwright visual capture
- **🤖 AI Visual Assessment** - GPT-4V/Claude integration
- **🔧 Automated Fix Generation** - Priority CSS/HTML improvements

## 📂 Project Structure

```
PixelPolish/
├── mcp_typescript/          # 🤖 MCP Server (MAIN)
│   ├── src/                 # TypeScript source code
│   ├── package.json         # Dependencies and scripts
│   ├── tsconfig.json        # TypeScript configuration
│   └── README.md            # Detailed MCP documentation
├── local/                   # 📁 HTML files for testing
├── .git/                    # Version control
└── .gitignore               # Git ignore rules
```

## 🔧 MCP Tools Available

When connected to an AI assistant, provides these tools:

- **`analyze_url`** - Comprehensive UI analysis with technical + AI scoring
- **`capture_screenshot`** - High-quality screenshot capture
- **`analyze_dom_structure`** - DOM element extraction and analysis
- **`run_heuristics_analysis`** - 190-point technical scoring

## 🎯 Key Features

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

### Integration Ready
- MCP protocol for AI assistant integration
- Environment variable configuration
- TypeScript with full type safety
- Production-ready architecture

## 📚 Full Documentation

See `mcp_typescript/README.md` for:
- Complete tool documentation
- API reference and parameters
- Development and customization guide
- Architecture overview

## 🏗️ Architecture Evolution

This project evolved from a split Express server system to a **unified MCP server** that provides:

- ✅ **AI Assistant Integration** - Direct tool access via MCP protocol
- ✅ **Comprehensive Analysis** - Technical + visual assessment combined
- ✅ **Real-time Processing** - Immediate analysis results
- ✅ **Simplified Deployment** - Single MCP server handles everything

## 🔐 Environment Variables

```bash
# For AI visual analysis (optional)
OPENAI_API_KEY=sk-...           # For GPT-4 Vision
ANTHROPIC_API_KEY=sk-ant-...    # For Claude Vision
```

---

**🎉 Ready to enhance AI assistants with comprehensive UI analysis capabilities!**

*Head to `mcp_typescript/` for the complete MCP server implementation.*

