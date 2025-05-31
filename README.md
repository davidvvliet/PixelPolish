PixelPolish
===========

PixelPolish is an AI-powered frontend agent that automatically cleans up, aligns, and enhances your UI components to look professional and pixel-perfect. Whether you're prototyping or preparing for production, PixelPolish ensures your interface is clean, accessible, and visually polished.

## Features

- **DOM Capture**: Uses Puppeteer to capture and analyze live web pages
- **CSS Analysis**: Extracts and analyzes styles, spacing, typography, and layout patterns
- **Heuristics Engine**: Runs comprehensive checks for alignment, consistency, and best practices
- **Alignment Detection**: Identifies misaligned elements and suggests improvements
- **Spacing Analysis**: Detects inconsistent margins, padding, and spacing patterns
- **Typography Review**: Ensures consistent font usage and hierarchy
- **Accessibility Checks**: Validates alt text, heading hierarchy, and other a11y concerns
- **Responsiveness Analysis**: Identifies fixed-width elements and layout issues
- **Performance Monitoring**: Detects DOM complexity and overlapping elements

## Architecture

```
src/
├── index.js                 # Express server and main entry point
├── dom/
│   └── DOMCapture.js        # Puppeteer-based DOM extraction
├── css/
│   └── CSSExtractor.js      # CSS analysis and pattern detection
└── heuristics/
    └── HeuristicsEngine.js  # Rule-based alignment and quality analysis
```

### Core Components

1. **DOMCapture**: Captures live DOM structure, computed styles, and element positioning
2. **CSSExtractor**: Analyzes spacing patterns, typography, colors, and layout properties
3. **HeuristicsEngine**: Runs multiple rule-based checks for design quality and alignment

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd PixelPolish
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`

3. **Test the setup:**
   ```bash
   npm run test-client
   ```

## Usage

### API Endpoints

#### POST `/analyze`
Analyzes a web page for alignment and design issues.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dom": {
      "url": "https://example.com",
      "title": "Example Page",
      "elements": [...],
      "totalElements": 145,
      "structure": {...}
    },
    "css": {
      "layoutStyles": [...],
      "spacing": {...},
      "typography": {...},
      "positioning": {...}
    },
    "analysis": {
      "score": 75,
      "scorePercentage": 75,
      "issues": [...],
      "recommendations": [...],
      "summary": {...}
    }
  }
}
```

#### GET `/health`
Health check endpoint.

### Using with curl

```bash
# Analyze a website
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Health check
curl http://localhost:3000/health
```

### Using with JavaScript

```javascript
import fetch from 'node-fetch';

const response = await fetch('http://localhost:3000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});

const result = await response.json();
console.log('Analysis Score:', result.data.analysis.scorePercentage + '%');
console.log('Issues Found:', result.data.analysis.summary.totalIssues);
```

## Heuristic Rules

The analysis engine includes several rule-based checks:

### 1. Alignment Rule (Weight: 2)
- Detects misaligned elements using grid-based analysis
- Checks horizontal and vertical alignment consistency
- Identifies elements that don't follow common alignment patterns

### 2. Spacing Consistency Rule (Weight: 1.5)
- Analyzes margin and padding patterns
- Detects inconsistent spacing values
- Suggests spacing scale standardization

### 3. Typography Consistency Rule (Weight: 1)
- Checks font size variety and consistency
- Analyzes font family usage
- Ensures proper typographic hierarchy

### 4. Responsiveness Rule (Weight: 1.5)
- Identifies fixed-width elements
- Analyzes flex and grid usage
- Suggests responsive improvements

### 5. Accessibility Rule (Weight: 2)
- Validates image alt text
- Checks heading hierarchy
- Ensures proper document structure

### 6. Performance Rule (Weight: 1)
- Monitors DOM complexity
- Detects overlapping elements
- Identifies potential layout issues

## Example Output

```
📊 Analyzing: https://example.com
──────────────────────────────────────────────────
⏱️  Analysis completed in 2341ms
📈 Overall Score: 78%
🔍 Total Issues: 12
   └─ Critical: 0, High: 2, Medium: 7, Low: 3
🏗️  DOM Elements: 145
📋 Page Title: Example Domain

🔴 Top Issues:
   1. [HIGH] Found 3 different font families. Limit to 2-3 fonts.
   2. [MEDIUM] Element at (50, 120) is not aligned to the vertical grid
   3. [MEDIUM] Found 15 different margin patterns. Consider standardizing.

💡 Top Recommendations:
   1. Found 12 alignment issues. Consider using CSS Grid or Flexbox for better alignment.
   2. Consider using a consistent spacing system (e.g., 8px, 16px, 24px multiples)
   3. Use a maximum of 2-3 font families for consistency

📊 Rule Breakdown:
   Alignment Rule: 70% (14/20)
   Spacing Consistency Rule: 80% (12/15)
   Typography Consistency Rule: 60% (6/10)
   Responsiveness Rule: 85% (13/15)
   Accessibility Rule: 90% (18/20)
   Performance Rule: 100% (10/10)
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic restarts on file changes.

### Adding New Rules

To add a new heuristic rule:

1. Create a new class extending `BaseRule` in `src/heuristics/HeuristicsEngine.js`
2. Implement the `evaluate(domData, cssData)` method
3. Add the rule to the `HeuristicsEngine` constructor

Example:
```javascript
class CustomRule extends BaseRule {
  constructor() {
    super('Custom Rule', 1);
  }

  async evaluate(domData, cssData) {
    return {
      score: 10,
      maxScore: 10,
      issues: [],
      recommendations: []
    };
  }
}
```

