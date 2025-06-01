<div align="center">
  <img src="ui-portal/public/pixelpolish-logo.webp" alt="PixelPolish Logo" width="200" />
</div>

# PixelPolish - AI-Powered Web Interface Manipulation Platform

**Professional DOM manipulation and analysis tools with natural language AI integration**

PixelPolish is a comprehensive web development platform that combines real-time DOM manipulation with AI-powered natural language processing. The system enables users to modify web interfaces through both direct interaction and conversational AI commands, while providing detailed analysis and change tracking capabilities.

## Core Features

### Interactive DOM Manipulation
- **Element Selection**: Click any element on a webpage to select and modify it instantly
- **Real-time Changes**: Apply modifications that take effect immediately in the preview
- **Precise Targeting**: Advanced CSS selector generation ensures changes affect only intended elements
- **Visual Feedback**: Selected elements are highlighted with clear visual indicators

### AI-Powered Natural Language Interface
- **Conversational Editing**: Describe changes in plain English (e.g., "make this text red and bold")
- **AI Integration**: Powered by GPT-4o and Claude for intelligent change interpretation
- **Context-Aware Processing**: AI understands element context and applies appropriate modifications
- **Multi-Action Support**: Single commands can trigger multiple related changes

### Professional Control Panel
- **Quick Actions**: One-click text editing, color changes, and element visibility controls
- **Advanced Color Picker**: Custom color selection with predefined palette options
- **State Management**: Automatic saving and restoration of all changes via browser localStorage
- **Change Tracking**: Comprehensive logging of all modifications for analysis and export

### MCP Server Integration
- **Structured Data Export**: Submit detailed change reports to Model Context Protocol servers
- **Analysis Ready**: Clean JSON format optimized for AI processing and analysis
- **Point-by-Point Summaries**: Human-readable descriptions alongside structured data
- **Real-time Submission**: Instant data transmission to configured MCP endpoints

## Quick Start

### 1. Install Dependencies
```bash
# Install UI Portal dependencies
cd ui-portal
npm install
```

### 2. Configure AI Integration
Create `ui-portal/src/config.js`:
```javascript
export const CONFIG = {
  OPENAI_API_KEY: 'your-openai-api-key-here'
};
```

### 3. Start Development Server
```bash
npm run dev
```

Access the application at `http://localhost:5173`

### 4. Launch Control Panel
The PixelPolish interface will load with:
- Interactive control panel on the left
- Target website preview on the right
- Real-time status feedback system

## System Architecture

### Frontend Components
- **Control Panel**: Vite-based React-style interface built with vanilla JavaScript
- **Element Inspector**: Real-time DOM analysis and selector generation
- **AI Assistant**: Natural language processing interface with OpenAI integration
- **State Manager**: Persistent change tracking and restoration system

### Backend Integration
- **MCP Server**: Model Context Protocol server for data analysis and processing
- **Change Processor**: Structured data generation for AI consumption
- **API Endpoints**: RESTful interfaces for external system integration

## Usage Guide

### Basic Interaction
1. **Select an Element**: Click any text, image, or container on the target webpage
2. **Choose Modification Method**:
   - Use quick action buttons for common changes
   - Type natural language commands in the AI Assistant
   - Apply custom colors using the integrated color picker
3. **Review Changes**: All modifications are applied instantly and automatically saved

### AI Assistant Commands
The natural language interface accepts various command types:

**Text Modifications**:
- "change text to Welcome to PixelPolish"
- "set text to Our New Heading"

**Style Changes**:
- "make this red and bold"
- "change background to blue"
- "make this bigger and center it"

**Visibility Controls**:
- "hide this element"
- "make this look like a warning button"

### State Management
- **Automatic Saving**: All changes are saved to browser localStorage instantly
- **Session Persistence**: Changes persist across browser sessions and page refreshes
- **Export Capabilities**: Export change sets as JSON for external processing
- **Reset Functionality**: One-click restoration to original state

### MCP Integration
Submit comprehensive change reports including:
- **Structured Change Data**: Machine-readable modification records
- **Human-Readable Summaries**: Point-by-point change descriptions
- **Element Context**: CSS selectors and element identification data
- **Categorized Statistics**: Change type breakdowns and totals

## Technical Specifications

### Supported Change Types
- **Text Content**: Direct text replacement and editing
- **CSS Styling**: Color, typography, spacing, and layout modifications
- **HTML Structure**: Element content and attribute changes
- **Class Management**: CSS class addition and removal
- **Visibility Control**: Element showing and hiding capabilities

### Browser Compatibility
- Modern browsers supporting ES6+ features
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browser support for responsive testing

### Security Considerations
- **API Key Management**: Local storage with user-controlled configuration
- **Cross-Origin Support**: Configurable iframe sources for target websites
- **Data Privacy**: All processing occurs client-side with optional external API calls

## Configuration Options

### Target Website Configuration
Modify the iframe source in `getTargetUrl()` function to point to your target website:
```javascript
function getTargetUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url');
  return targetUrl || 'your-default-website-url';
}
```

### MCP Server Endpoint
Configure the submission endpoint for change data:
```javascript
const endpoint = `${window.location.protocol}//${window.location.hostname}:${currentPort}/api/submit`;
```

## Development and Customization

### Extending Functionality
- **Custom Actions**: Add new quick action buttons to the control panel
- **AI Commands**: Extend natural language processing capabilities
- **Export Formats**: Create additional data export options
- **Integration Points**: Connect with external design systems and tools

### Code Structure
```
ui-portal/
├── src/
│   ├── main.js          # Core application logic
│   ├── config.js        # Configuration and API keys
│   ├── style.css        # Application styling
│   └── assets/          # Images and static resources
├── landing-page.html    # Default target website
├── package.json         # Dependencies and scripts
└── dist/               # Built application files
```

## Data Export Format

### Change Submission Structure
```json
{
  "timestamp": "2024-01-28T15:30:45.123Z",
  "pageUrl": "/landing-page.html",
  "changes": [
    {
      "type": "text",
      "selector": "div.hero > h1:nth-child(1)",
      "action": "changed text",
      "newValue": "Welcome to PixelPolish"
    }
  ],
  "summary": {
    "totalChanges": 1,
    "overview": "Made 1 modification to the webpage",
    "pointByPoint": ["Changed text content..."],
    "categories": {
      "textChanges": 1,
      "styleChanges": 0,
      "htmlChanges": 0,
      "classChanges": 0,
      "hiddenElements": 0
    }
  }
}
```

## Production Deployment

### Build Process
```bash
npm run build
```

### Environment Setup
- Configure production API endpoints
- Set appropriate CORS policies for target websites
- Ensure secure API key management
- Implement proper error handling and logging

## Troubleshooting

### CORS Issues
If you encounter Cross-Origin Resource Sharing (CORS) errors when running PixelPolish on different computers:

1. **OpenAI API CORS Errors**: PixelPolish uses a local proxy to avoid browser CORS restrictions. API calls are automatically routed through `/api/openai/` instead of direct OpenAI URLs.

2. **MCP Server Connection Issues**: The submit functionality gracefully handles MCP server unavailability with offline mode. Changes are saved locally when the MCP server isn't running.

3. **Cross-Origin Iframe Issues**: The Vite configuration includes comprehensive CORS headers and proper iframe compatibility settings.

For detailed CORS troubleshooting, see `CORS-TROUBLESHOOTING.md`.

### Quick CORS Fixes
- Restart the development server: `npm run dev`
- Clear browser cache and reload
- Check browser console for specific error details
- Ensure configuration is properly set in `ui-portal/src/config.js`
- Try in a different browser or incognito mode

### Network Configuration
The application works in "offline mode" when external services are unavailable:
- **AI Assistant**: Requires OpenAI API key and internet connection
- **MCP Server**: Optional - submit functionality works without it
- **Local Changes**: Always saved to browser localStorage

---

**PixelPolish provides professional-grade web interface manipulation capabilities with intuitive AI-powered natural language processing, making complex DOM modifications accessible through conversational interaction.**