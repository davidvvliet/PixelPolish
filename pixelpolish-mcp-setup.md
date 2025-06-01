# PixelPolish MCP Server Setup Guide

This guide shows how to add the PixelPolish MCP server to Claude Code for advanced UI analysis capabilities.

## What is PixelPolish MCP Server?

The PixelPolish MCP server provides Claude with powerful UI analysis tools including:
- Comprehensive website analysis (DOM, CSS, heuristics, screenshots)
- AI-powered visual assessment using multiple AI providers
- Screenshot capture with high-quality output
- 190-point heuristics evaluation system
- DOM structure analysis and extraction
- Local development server management

## Prerequisites

- Claude Code installed and working on your Mac terminal
- Node.js 18.0.0 or higher
- PixelPolish project with built MCP server (`mcp_typescript/dist/index.js` exists)

## Step-by-Step Setup

### 1. Navigate to Your PixelPolish Directory

```bash
cd /path/to/PixelPolish
```

### 2. Ensure MCP Server is Built

```bash
cd mcp_typescript
npm install
npm run build
cd ..
```

### 3. Add PixelPolish MCP Server to Claude

Execute this single command to add the server with all required API keys:

```bash
claude mcp add pixelpolish \
  -e GEMINI_API_KEY=your_gemini_api_key_here \
  -e OPENROUTER_API_KEY=your_openrouter_api_key_here \
  -e OPENAI_API_KEY=your_openai_api_key_here \
  -e ANTHROPIC_API_KEY=your_anthropic_api_key_here \
  -- node mcp_typescript/dist/index.js
```

**Note**: Replace the placeholder values with your actual API keys. Never commit real API keys to version control.

### 4. What Happens When You Add the Server

When you execute the command above, Claude will:

1. **Register the MCP Server**: Add "pixelpolish" to your local MCP configuration
2. **Set Environment Variables**: Configure all four AI provider API keys:
   - `GEMINI_API_KEY` - For Google's Gemini AI analysis
   - `OPENROUTER_API_KEY` - For OpenRouter AI services
   - `OPENAI_API_KEY` - For OpenAI GPT analysis
   - `ANTHROPIC_API_KEY` - For Anthropic Claude analysis
3. **Configure Command Path**: Point to `node mcp_typescript/dist/index.js`
4. **Store Configuration**: Save settings to your local Claude configuration

**Expected Output:**
```
Added stdio MCP server pixelpolish with command: node mcp_typescript/dist/index.js to local config
```

### 5. Verify Installation

Check that your server is properly configured:

```bash
# List all MCP servers
claude mcp list

# Expected output:
# pixelpolish: node mcp_typescript/dist/index.js
```

Get detailed server configuration:

```bash
# View server details
claude mcp get pixelpolish
```

## Available Tools After Setup

Once configured, Claude will have access to these PixelPolish tools:

### 🔍 `analyze_url`
**Purpose**: Comprehensive UI analysis combining all analysis methods
**What it does**:
- Captures DOM structure and elements
- Extracts CSS styles and rules
- Runs 190-point heuristics evaluation
- Takes high-quality screenshots
- Performs AI-powered visual assessment
- Combines scores for overall rating

**Parameters**:
- `url` (required): Website URL to analyze
- `include_screenshot` (optional): Include screenshot analysis (default: true)
- `ai_provider` (optional): AI provider - 'openai', 'anthropic', 'gemini' (default: 'openai')

### 📸 `capture_screenshot`
**Purpose**: High-quality screenshot capture
**What it does**:
- Uses Playwright for reliable screenshot capture
- Saves images to `mcp_typescript/screenshots/` directory
- Returns base64 encoded image data
- Handles responsive layouts and full-page capture

**Parameters**:
- `url` (required): URL to screenshot
- `filename` (optional): Custom filename (default: 'screenshot')

### 🏗️ `analyze_dom_structure`
**Purpose**: DOM structure analysis and extraction
**What it does**:
- Extracts complete DOM tree structure
- Counts elements by type (headings, forms, images, etc.)
- Analyzes semantic HTML usage
- Identifies navigation and content structure

**Parameters**:
- `url` (required): URL to analyze

### 📊 `run_heuristics_analysis`
**Purpose**: 190-point heuristics evaluation
**What it does**:
- Evaluates usability principles
- Checks accessibility compliance
- Analyzes design consistency
- Scores performance indicators
- Provides detailed issue breakdown

**Parameters**:
- `url` (required): URL to analyze

### 🚀 `serve_vite_app`
**Purpose**: Local development server management
**What it does**:
- Serves built UI Portal application
- Handles CORS for API testing
- Provides local development environment
- Supports custom port configuration

**Parameters**:
- `port` (optional): Server port (default: 8080)
- `dist_path` (optional): Path to built files (default: './ui-portal/dist')

### ⏹️ `stop_vite_app`
**Purpose**: Stop running development server
**What it does**:
- Gracefully shuts down HTTP server
- Frees up port for other applications
- Cleans up server resources

### ⏱️ `wait`
**Purpose**: Execution pause utility
**What it does**:
- Pauses execution for specified duration
- Useful for waiting between analysis steps
- Provides custom wait messages

**Parameters**:
- `duration_seconds` (optional): Wait time in seconds (default: 50)
- `message` (optional): Custom wait message

## Usage Examples

### Basic Website Analysis
```plaintext
> analyze this website comprehensively: https://example.com
```

**What happens**:
1. DOM structure is captured and analyzed
2. CSS styles are extracted and evaluated
3. 190-point heuristics analysis is performed
4. Screenshot is taken and analyzed by AI
5. Combined score is calculated and reported
6. Detailed recommendations are provided

### Screenshot with Custom Filename
```plaintext
> take a screenshot of https://mysite.com and save it as "homepage-v2"
```

**What happens**:
1. Playwright browser launches
2. Page is loaded and rendered
3. Full-page screenshot is captured
4. Image is saved as `homepage-v2.png` in screenshots directory
5. Base64 data is returned for immediate use

### Heuristics-Only Analysis
```plaintext
> run heuristics analysis on https://myapp.com without screenshots
```

**What happens**:
1. DOM and CSS data is captured
2. 190-point evaluation system runs
3. Issues are categorized by severity
4. Detailed score breakdown is provided
5. Specific recommendations are generated

## Security Considerations

### API Key Management
- **Never commit real API keys to version control**
- Store API keys in environment variables or secure configuration files
- Add `.env` files to your `.gitignore` to prevent accidental commits
- Use placeholder values in documentation and examples
- Rotate API keys regularly for security

### Recommended Setup for Production
```bash
# Create a secure .env file (add to .gitignore)
echo "GEMINI_API_KEY=your_actual_gemini_key" > .env
echo "OPENROUTER_API_KEY=your_actual_openrouter_key" >> .env
echo "OPENAI_API_KEY=your_actual_openai_key" >> .env
echo "ANTHROPIC_API_KEY=your_actual_anthropic_key" >> .env

# Add the server using environment file
claude mcp add pixelpolish --env-file .env -- node mcp_typescript/dist/index.js
```

## Configuration Details

### Environment Variables Set
- **GEMINI_API_KEY**: Enables Google Gemini AI analysis
- **OPENROUTER_API_KEY**: Provides access to multiple AI models via OpenRouter
- **OPENAI_API_KEY**: Enables OpenAI GPT-4 Vision analysis
- **ANTHROPIC_API_KEY**: Enables Claude AI visual assessment

### File Locations
- **Screenshots**: `mcp_typescript/screenshots/`
- **Analysis Results**: `mcp_typescript/analysis-results/`
- **Server Logs**: Console output during execution

### Scoring System
- **Technical Score**: Based on 190-point heuristics (60% weight)
- **Visual Score**: AI-powered visual assessment (40% weight)
- **Combined Score**: Weighted average of both scores
- **Issue Prioritization**: Ranked by impact and severity

## Troubleshooting

### Server Not Found
```bash
# Check if server is properly added
claude mcp list

# If missing, re-add with the setup command above
```

### Build Issues
```bash
# Rebuild the MCP server
cd mcp_typescript
npm run clean
npm install
npm run build
```

### API Key Issues
```bash
# Verify environment variables are set
claude mcp get pixelpolish

# Re-add server if keys are missing
```

### Screenshot Failures
```bash
# Install Playwright browsers
cd mcp_typescript
npx playwright install
```

## Advanced Usage

### Custom AI Provider Selection
```plaintext
> analyze https://example.com using anthropic for visual analysis
```

### Batch Analysis Workflow
```plaintext
> analyze the homepage: https://mysite.com
> wait for 30 seconds to let the analysis complete
> take a screenshot of the results page
> serve the UI portal to review findings
```

### Development Testing
```plaintext
> serve the vite app on port 3000
> analyze localhost:3000 for development testing
> stop the vite app when done
```

This setup provides Claude with comprehensive UI analysis capabilities, making it an powerful tool for web development, design review, and quality assurance workflows.