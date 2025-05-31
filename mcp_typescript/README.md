# PixelPolish MCP Server

**🤖 UI Analysis Tools for AI Assistants**

A comprehensive MCP (Model Context Protocol) server that provides UI analysis capabilities to AI assistants like Claude. Includes DOM analysis, CSS pattern extraction, 190-point heuristics scoring, screenshot capture, and AI visual assessment.

## 🚀 Quick Start

```bash
npm install
npx playwright install chromium
npm run build
npm start
```

## 🔧 MCP Tools Available

### `analyze_url`
Comprehensive UI analysis including DOM structure, CSS patterns, heuristics scoring, screenshots, and AI visual assessment.

**Parameters:**
- `url` (required): URL to analyze
- `include_screenshot` (optional): Whether to capture screenshot for AI analysis (default: true)
- `ai_provider` (optional): 'openai' or 'anthropic' (default: 'openai')

### `capture_screenshot`
Take high-quality screenshots of any URL using Playwright.

**Parameters:**
- `url` (required): URL to screenshot
- `filename` (optional): Custom filename (default: 'screenshot')

### `analyze_dom_structure`
Extract and analyze DOM structure, including headings, navigation, forms, images, and links.

**Parameters:**
- `url` (required): URL to analyze

### `run_heuristics_analysis`
Run comprehensive 190-point heuristics analysis across 6 rule categories.

**Parameters:**
- `url` (required): URL to analyze

## 🏗️ Architecture

### Core Services
- **DOM Capture** - Puppeteer-based element extraction with computed styles
- **CSS Extractor** - Layout, spacing, typography, and color analysis
- **Heuristics Engine** - 190-point scoring system with 6 rule categories
- **Screenshot Service** - Playwright visual capture with cache-busting
- **AI Analyzer** - GPT-4V/Claude integration for visual assessment

### 190-Point Heuristics System
- **Alignment Rule** (40 points) - Grid-based alignment detection
- **Spacing Consistency** (35 points) - Margin/padding pattern analysis
- **Typography Consistency** (30 points) - Font usage and hierarchy
- **Accessibility Rule** (35 points) - Alt text, heading hierarchy, structure
- **Responsiveness Rule** (25 points) - Modern layout usage (Flexbox/Grid)
- **Performance Rule** (25 points) - DOM complexity and optimization

## 🎯 Usage with AI Assistants

This MCP server is designed to be used by AI assistants. When connected, the assistant gains access to comprehensive UI analysis tools.

**Example workflow:**
1. AI uses `analyze_url` tool to get complete analysis
2. Receives technical scoring, visual assessment, and priority fixes
3. Can drill down with specific tools like `run_heuristics_analysis`
4. Screenshots captured automatically for visual context

## 🔐 Environment Variables

```bash
# For AI visual analysis (optional)
OPENAI_API_KEY=sk-...           # For GPT-4 Vision
ANTHROPIC_API_KEY=sk-ant-...    # For Claude Vision
```

## 🛠️ Development

```bash
npm run dev       # Watch mode
npm run build     # Compile TypeScript
npm run clean     # Clean build artifacts
```

## 📊 Analysis Output

### Technical Analysis
- DOM structure with element count and hierarchy
- CSS pattern analysis (spacing, typography, colors)
- 190-point heuristics scoring with rule breakdown
- Issue classification by severity (critical, high, medium, low)
- Actionable recommendations

### AI Visual Assessment
- Overall design quality evaluation
- Color harmony and layout balance assessment
- Typography consistency analysis
- Accessibility scoring
- Priority fix recommendations with specific CSS/HTML changes

### Combined Scoring
- Technical Score (60%) + Visual AI Score (40%)
- Comprehensive issue summary
- Priority action items

## 🎉 Benefits

- **For AI Assistants**: Provides deep UI analysis capabilities
- **For Developers**: Get actionable feedback on design quality
- **For Design Systems**: Automated consistency checking
- **For Accessibility**: Built-in a11y compliance validation

---

**Ready to enhance your AI assistant with comprehensive UI analysis capabilities!**