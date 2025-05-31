# PixelPolish AI Agent - TypeScript MCP

A TypeScript-based AI agent that automatically analyzes and fixes UI issues using Playwright screenshots and AI vision models.

## Features

- 🎨 **Real-time UI monitoring** - Watches localhost:3002 for changes
- 📸 **Playwright screenshots** - Captures visual state of web pages  
- 🤖 **AI-powered analysis** - Uses GPT-4 Vision or Claude for visual assessment
- 🔧 **Automated fixes** - Suggests and applies CSS/HTML improvements
- 👀 **File watching** - Monitors local HTML files for changes
- 📊 **Comprehensive reporting** - Detailed analysis and recommendations

## Quick Start

### Prerequisites

- Node.js 18+
- Running PixelPolish server on localhost:3002

### Installation

```bash
cd mcp_typescript
npm install
npx playwright install chromium
```

### Environment Setup

Create a `.env` file (optional):

```bash
# For AI analysis (choose one)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Usage

```bash
# Basic usage (mock AI analysis)
npm start

# With AI analysis
OPENAI_API_KEY=your_key npm start

# Enable auto-fixing
npm start -- --auto-fix

# Use Claude instead of GPT-4
npm start -- --ai-provider anthropic

# Custom configuration
npm start -- --url http://localhost:3000 --interval 5000
```

## Commands

### Development

```bash
npm run dev          # Watch mode with hot reload
npm run build        # Build TypeScript to JavaScript
npm run test         # Run connection tests
```

### Options

```bash
--url <url>              PixelPolish server URL (default: http://localhost:3002)
--local-dir <path>       Local HTML files directory (default: ../local)
--ai-provider <provider> AI provider: openai|anthropic (default: openai)
--auto-fix               Enable automatic CSS/HTML fixes (default: disabled)
--interval <ms>          Watch interval in milliseconds (default: 2000)
--test                   Run connection tests
--help                   Show help
```

## How It Works

1. **File Watcher**: Monitors the local HTML directory for changes
2. **Server Monitor**: Polls PixelPolish server for new analysis results
3. **Screenshot Capture**: Takes Playwright screenshots of analyzed pages
4. **AI Analysis**: Sends screenshots to AI models for visual assessment
5. **Fix Application**: Suggests and optionally applies automated fixes

## AI Analysis

The AI provides:

- **Visual Assessment**: Overall quality, color harmony, layout balance
- **Typography Analysis**: Font consistency and readability
- **Accessibility Score**: A11y compliance evaluation  
- **Mobile Responsiveness**: Cross-device compatibility
- **Priority Fixes**: Specific CSS/HTML improvements
- **Detailed Feedback**: Comprehensive design recommendations

## Architecture

```
src/
├── types.ts         # TypeScript interfaces
├── screenshot.ts    # Playwright screenshot service
├── analyzer.ts      # AI analysis integration
├── watcher.ts       # File & server monitoring
└── index.ts         # Main application entry
```

## Example Output

```
🎨 PixelPolish AI Agent Starting...
📋 Configuration:
   PixelPolish URL: http://localhost:3002
   Local Directory: /path/to/local
   AI Provider: openai
   Auto-fix: false

✅ PixelPolish server is running
🔔 New analysis detected at 2024-05-31T21:15:30.123Z
🔍 Processing new analysis for: landing-page.html
📸 Taking screenshot of: http://localhost:3002/local/landing-page.html
✅ Screenshot saved: ./screenshots/landing-page_1685560530123.png

🤖 AI Analysis Results:
   Visual Score: 72%
   Technical Score: 32%
   Priority Fixes: 3

🔧 Priority Fixes:
   1. [HIGH] .hero-section: Inconsistent padding and spacing
   2. [MEDIUM] .cta-button: Button size may be too large for mobile
   3. [LOW] .footer: Improve color contrast for accessibility
```

## Integration with PixelPolish

This agent is designed to work alongside the main PixelPolish server:

1. **Main Server** (`../src/index.js`) - Provides technical analysis
2. **AI Agent** (this project) - Adds visual AI analysis and automated fixes
3. **Local Files** (`../local/`) - HTML files being analyzed
4. **Dashboard** (`http://localhost:3002`) - View results

## Troubleshooting

### Server Connection Issues

```bash
# Test server connection
npm run test

# Check if PixelPolish server is running
curl http://localhost:3002/health
```

### Screenshot Issues

```bash
# Reinstall Playwright browsers
npx playwright install chromium

# Test screenshot service
npm run test
```

### AI Analysis Not Working

- Verify API keys are set correctly
- Check network connectivity
- Review AI provider quotas/limits
- Use mock analysis mode for testing

## Development

### Adding New AI Providers

1. Extend the `AIAnalyzer` class in `src/analyzer.ts`
2. Add provider-specific implementation
3. Update type definitions in `src/types.ts`

### Customizing Analysis

Modify the analysis prompt in `src/analyzer.ts` to focus on specific design aspects:

```typescript
private buildAnalysisPrompt(technicalScore: number, issuesCount: number): string {
  return `Your custom analysis prompt...`;
}
```