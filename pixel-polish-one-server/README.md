# PixelPolish Comprehensive AI Agent

**🤖 All-in-One AI-Powered UI Analysis and Automated Fixing System**

A complete TypeScript solution that combines DOM analysis, CSS pattern extraction, heuristics scoring, screenshot capture, and AI visual assessment into a single powerful agent.

## ✨ Features

### 🔍 **Technical Analysis Engine**
- **DOM Structure Analysis** - Puppeteer-based element extraction with computed styles
- **CSS Pattern Detection** - Layout, spacing, typography, and color analysis
- **190-Point Heuristics System** - 6 rule categories with comprehensive scoring:
  - Alignment Rule (40 points)
  - Spacing Consistency (35 points) 
  - Typography Consistency (30 points)
  - Accessibility Rule (35 points)
  - Responsiveness Rule (25 points)
  - Performance Rule (25 points)

### 🤖 **AI Visual Assessment**
- **Playwright Screenshots** - High-quality visual capture with cache-busting
- **AI Vision Models** - Support for GPT-4 Vision and Claude Sonnet
- **Smart Analysis** - Visual hierarchy, color harmony, layout balance assessment
- **Priority Fix Generation** - Actionable CSS/HTML improvements

### 🎯 **Comprehensive Integration**
- **Combined Scoring** - Technical (60%) + Visual AI (40%) scores
- **Express Server** - REST API with real-time dashboard
- **File Monitoring** - Auto-analysis on HTML file changes
- **Auto-Fix Capability** - Intelligent code improvement suggestions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Optional: OpenAI or Anthropic API keys for AI analysis

### Installation
```bash
cd mcp_typescript
npm install
npx playwright install chromium
```

### Basic Usage
```bash
# Server mode (recommended)
npm start

# Server + file monitoring mode  
npm start -- --monitor

# With AI analysis
OPENAI_API_KEY=your_key npm start

# Enable auto-fixing
npm start -- --auto-fix --ai-provider anthropic
```

## 📊 Dashboard

Access the comprehensive dashboard at: **http://localhost:3002**

The dashboard provides:
- 🎯 **Combined Score Display** - Technical + AI visual assessment
- 📸 **Screenshot Preview** - Visual state of analyzed pages
- 🔧 **Priority AI Fixes** - Specific CSS/HTML improvements
- 📊 **Rule Breakdown** - Detailed heuristics analysis
- 🤖 **AI Assessment** - Visual quality evaluation
- ⚡ **Real-time Updates** - Auto-refreshing analysis results

## 🛠️ API Endpoints

### POST `/analyze`
Comprehensive analysis of any URL
```json
{
  "url": "https://example.com"
}
```

### POST `/analyze-local`
Analyze local HTML files
```json
{
  "filename": "landing-page.html"
}
```

### GET `/dashboard`
Get latest analysis results (JSON)

### GET `/health`
Service health check with component status

## 🎮 Command Line Options

```bash
# Modes
--server                    # Server mode only (default)
--monitor                   # Server + file monitoring

# Configuration  
--port <port>               # Server port (default: 3002)
--local-dir <path>          # HTML files directory (default: ../local)
--ai-provider <provider>    # openai|anthropic (default: openai)
--auto-fix                  # Enable automated fixes (default: off)
--interval <ms>             # Watch interval (default: 3000ms)

# Utilities
--test                      # Run system tests
--help                      # Show help
```

## 🏗️ Architecture

```
PixelPolish Comprehensive AI Agent
├── 🔍 DOM Capture Service (Puppeteer)
├── 🎨 CSS Extractor Service  
├── 📊 Heuristics Engine (190-point system)
├── 📸 Screenshot Service (Playwright)
├── 🤖 AI Analyzer (GPT-4V/Claude)
├── 🖥️ Express Server (API + Dashboard)
└── 👀 File Watcher (Real-time monitoring)
```

### Core Services

**DOM Capture** (`src/dom-capture.ts`)
- Puppeteer-based page analysis
- Element extraction with computed styles
- Structural information parsing

**CSS Extractor** (`src/css-extractor.ts`)  
- Layout pattern analysis
- Spacing and typography consistency
- Color scheme extraction

**Heuristics Engine** (`src/heuristics-engine.ts`)
- 6 comprehensive rule categories
- 190-point scoring system
- Detailed issue reporting

**Screenshot Service** (`src/screenshot.ts`)
- Playwright visual capture
- Cache-busting capabilities
- Multiple viewport support

**AI Analyzer** (`src/analyzer.ts`)
- Multi-provider support (OpenAI/Anthropic)
- Visual assessment prompts
- Priority fix generation

**Express Server** (`src/server.ts`)
- REST API endpoints
- Real-time dashboard
- Static file serving

## 📈 Analysis Output

### Technical Analysis
- **Element Count** - DOM complexity assessment
- **Rule Scores** - Individual heuristics performance
- **Issue Categories** - Severity-based problem classification
- **Recommendations** - Actionable improvement suggestions

### AI Visual Analysis
- **Overall Quality** - General design assessment
- **Color Harmony** - Color scheme evaluation
- **Layout Balance** - Visual hierarchy analysis
- **Accessibility Score** - A11y compliance rating
- **Priority Fixes** - AI-generated improvement actions

### Combined Results
```typescript
{
  success: true,
  filename: "landing-page.html",
  analyzedAt: "2024-05-31T21:15:30.123Z",
  technical: { score: 32, scorePercentage: 32, issues: [...] },
  visual: { visual_score: 68, priority_fixes: [...] },
  screenshot: { screenshotBase64: "...", timestamp: 1685560530123 },
  combined_score: 45, // 60% technical + 40% visual
  priority_actions: [...] // Top 5 fixes
}
```

## 🔧 Development

### Build & Test
```bash
npm run build          # Compile TypeScript
npm run dev            # Watch mode development
npm run test           # Run system tests
npm run clean          # Clean build artifacts
```

### Custom AI Prompts
Modify `src/analyzer.ts` to customize AI analysis:

```typescript
private buildAnalysisPrompt(technicalScore: number, issuesCount: number): string {
  return `Your custom analysis prompt focusing on specific design aspects...`;
}
```

### Adding New Heuristics Rules
Extend `src/heuristics-engine.ts`:

```typescript
class CustomRule extends BaseRule {
  constructor() {
    super('Custom Rule', 1.5);
  }

  async evaluate(domData: DOMData, cssData: CSSData): Promise<RuleResult> {
    // Your custom rule logic
  }
}
```

## 🌟 Why This Architecture?

### ✅ **Advantages of Unified System**
- **Single Deployment** - One service handles everything
- **Consistent Data Flow** - No inter-service communication overhead  
- **Comprehensive Analysis** - Technical + visual assessment combined
- **Real-time Processing** - Immediate results with live dashboard
- **Simplified Maintenance** - Single codebase to manage

### 🔄 **Compared to Split Architecture**
| Feature | Unified Agent | Split System |
|---------|---------------|--------------|
| Setup Complexity | ✅ Simple | ❌ Complex |
| Performance | ✅ Fast | ⚠️ Network overhead |
| Data Consistency | ✅ Guaranteed | ⚠️ Sync issues |
| Resource Usage | ✅ Efficient | ❌ Duplicate services |
| Development | ✅ Streamlined | ❌ Multi-repo |

## 📝 Example Workflow

1. **File Monitoring** - Place HTML file in `local/` directory
2. **Auto-Detection** - File watcher triggers analysis
3. **DOM Capture** - Puppeteer extracts page structure
4. **CSS Analysis** - Pattern detection and consistency checking
5. **Technical Scoring** - 190-point heuristics evaluation
6. **Screenshot Capture** - Playwright visual state capture
7. **AI Assessment** - GPT-4V/Claude visual analysis
8. **Fix Generation** - Priority improvement suggestions
9. **Dashboard Update** - Real-time results display
10. **Optional Auto-Fix** - Automated code improvements

## 🔐 Environment Variables

```bash
# AI Analysis (optional)
OPENAI_API_KEY=sk-...           # For GPT-4 Vision
ANTHROPIC_API_KEY=sk-ant-...    # For Claude Vision

# Development
NODE_ENV=development            # Enable debug logging
```

## 🎯 Use Cases

- **Design System Audits** - Consistency checking across components
- **Accessibility Reviews** - A11y compliance validation
- **Performance Optimization** - DOM complexity analysis
- **Visual QA** - AI-powered design quality assessment
- **Automated Fixes** - Intelligent code improvements
- **Real-time Monitoring** - Continuous design quality tracking

## 🚀 Next Steps

The comprehensive AI agent is ready for production use. Consider these enhancements:

- **Multi-file Analysis** - Batch processing capabilities
- **Custom Rule Engine** - User-defined heuristics
- **Fix Automation** - Direct code modification
- **Integration APIs** - CI/CD pipeline integration
- **Advanced AI Models** - Specialized design assessment

---

**🎉 You now have a complete, self-contained AI agent that provides comprehensive UI analysis and automated fixing capabilities!**