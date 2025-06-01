import './style.css'
import pixelPolishLogo from '/pixelpolish-logo.webp'
import { CONFIG } from './config.js'

// Get URL from query parameters or use default
function getTargetUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url');
  return targetUrl || 'http://localhost:8081/landing-page';
}

document.querySelector('#app').innerHTML = `
  <div>
    <div class="header">
      <img src="${pixelPolishLogo}" class="logo pixelpolish" alt="PixelPolish logo" />
    </div>

    <div class="main-content">
      <div class="control-panel">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h2 style="margin: 0;">Control Panel</h2>
          <button class="action-btn" onclick="submitToMCP()" style="background: #4CAF50; color: white; font-weight: bold;">Submit</button>
        </div>
        
        <!-- Selected Element -->
        <div class="control-section" id="selectedElementSection" style="display: none;">
          <h3 class="section-header" onclick="toggleSection('selectedElement')">
            <span>Selected Element</span>
            <span class="toggle-icon">▼</span>
          </h3>
          <div class="section-content" id="selectedElement" style="display: block;">
            <div id="elementInfo" class="element-info">
              <p><strong>Tag:</strong> <span id="elementTag">-</span></p>
              <p><strong>ID:</strong> <span id="elementId">-</span></p>
              <p><strong>Selector:</strong> <span id="elementSelector">-</span></p>
              <p><strong>Text:</strong> <span id="elementText">-</span></p>
            </div>
            <div class="quick-actions">
              <button class="action-btn" onclick="quickEditText()">Edit Text</button>
              <button class="action-btn" onclick="quickChangeColor()">Text Color</button>
              <button class="action-btn" onclick="quickChangeBg()">Background Color</button>
              <button class="action-btn" onclick="quickHide()">Hide</button>
            </div>
            
            <!-- AI Assistant -->
            <div class="ai-assistant" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
              <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">AI Assistant</h4>
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">Describe what you want to change about this element:</p>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="aiRequest" placeholder="e.g., make this text red and bold" 
                       style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;"
                       onkeypress="if(event.key==='Enter') askAI()">
                <button class="action-btn" onclick="askAI()" style="padding: 8px 12px; font-size: 12px;">Ask AI</button>
              </div>
              <div id="aiStatus" style="margin-top: 8px; font-size: 11px; color: #666;"></div>
            </div>
          </div>
        </div>

        <!-- Hidden Elements -->
        <div class="control-section" id="hiddenElementsSection" style="display: none;">
          <h3 class="section-header collapsed" onclick="toggleSection('hiddenElements')">
            <span>Hidden Elements</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="hiddenElements" style="display: none;">
            <div class="form-group">
              <button class="action-btn" onclick="showAllHidden()">Show All Hidden</button>
            </div>
            <div id="hiddenElementsList"></div>
          </div>
        </div>
        
        <!-- Dynamic Page Controls -->
        <div class="control-section">
          <h3 class="section-header collapsed" onclick="toggleSection('dynamicControls')">
            <span>Dynamic Page Controls</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="dynamicControls" style="display: none;">
            <div class="form-group">
              <p class="info-text">These controls are dynamically generated based on page analysis.</p>
            </div>
            <div class="button-group">
              <button class="action-btn" onclick="generateDynamicControls()">Generate Controls</button>
            </div>
            <div id="generatedControls"></div>
          </div>
        </div>

        <!-- State Management -->
        <div class="control-section">
          <h3 class="section-header collapsed" onclick="toggleSection('stateManagement')">
            <span>State Management</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="stateManagement" style="display: none;">
            <div class="form-group">
              <p class="info-text">Changes are automatically saved to browser storage and restored on page refresh.</p>
            </div>
            <div class="button-group">
              <button class="action-btn danger" onclick="clearSavedState()">Reset Changes</button>
            </div>
          </div>
        </div>
        
        <!-- Status -->
        <div class="control-section">
          <h3>Status</h3>
          <div id="status" class="status-area">Ready to manipulate DOM...</div>
        </div>

        
      </div>

      <div class="iframe-container">
        <h2>Target Website</h2>
        <iframe 
          id="targetIframe"
          src="${getTargetUrl()}" 
          width="900" 
          height="700" 
          frameborder="0"
          title="Target Website">
        </iframe>
      </div>
    </div>
  </div>
`

// DOM Manipulation Functions
let targetIframe;
let selectedElementInfo = null;
let hiddenElements = [];
let isRestoring = false;
let savedState = {
  textChanges: {},
  styleChanges: {},
  htmlChanges: {},
  classChanges: {},
  hiddenElements: []
};

// Load saved state from localStorage
function loadSavedState() {
  const saved = localStorage.getItem('pixelpolish-state');
  console.log('Loading saved state:', saved);
  if (saved) {
    try {
      savedState = JSON.parse(saved);
      hiddenElements = savedState.hiddenElements || [];
      updateHiddenElementsList();
      console.log('Successfully loaded saved state:', savedState);
    } catch (error) {
      console.error('Error parsing saved state:', error);
      updateStatus('Error loading saved state', false);
    }
  } else {
    console.log('No saved state found');
  }
}

// Save current state to localStorage
function saveCurrentState() {
  savedState.hiddenElements = hiddenElements;
  console.log('Saving state to localStorage:', savedState);
  localStorage.setItem('pixelpolish-state', JSON.stringify(savedState));
  updateStatus('Changes saved to browser storage', true);
}

// Apply saved state to the demo page
function applySavedState() {
  isRestoring = true;
  
  // Apply text changes
  Object.keys(savedState.textChanges).forEach(selector => {
    sendMessageToIframe({
      action: 'changeText',
      selector: selector,
      content: savedState.textChanges[selector]
    });
  });

  // Apply style changes
  Object.keys(savedState.styleChanges).forEach(selector => {
    Object.keys(savedState.styleChanges[selector]).forEach(property => {
      sendMessageToIframe({
        action: 'changeStyle',
        selector: selector,
        property: property,
        value: savedState.styleChanges[selector][property]
      });
    });
  });

  // Apply HTML changes
  Object.keys(savedState.htmlChanges).forEach(selector => {
    sendMessageToIframe({
      action: 'changeHTML',
      selector: selector,
      content: savedState.htmlChanges[selector]
    });
  });

  // Apply class changes
  Object.keys(savedState.classChanges).forEach(selector => {
    savedState.classChanges[selector].forEach(className => {
      sendMessageToIframe({
        action: 'addClass',
        selector: selector,
        value: className
      });
    });
  });

  // Apply hidden elements
  hiddenElements.forEach(element => {
    sendMessageToIframe({
      action: 'hide',
      selector: element.selector
    });
  });
  
  isRestoring = false;
}

// Enhanced clear saved state function with optional confirmation
function clearSavedState(showConfirmation = true) {
  const shouldClear = showConfirmation ? 
    confirm('Are you sure you want to clear all saved changes? This will reset everything to the original state.') : 
    true;
    
  if (shouldClear) {
    localStorage.removeItem('pixelpolish-state');
    savedState = {
      textChanges: {},
      styleChanges: {},
      htmlChanges: {},
      classChanges: {},
      hiddenElements: []
    };
    hiddenElements = [];
    updateHiddenElementsList();
    
    if (showConfirmation) {
      location.reload(); // Only reload if this was a manual clear
    }
  }
  
  return shouldClear;
}

// Clear all saved state
window.clearSavedState = function() {
  clearSavedState(true); // Use the enhanced function with confirmation
}

// Enhanced sendMessageToIframe that saves state
function sendMessageToIframe(data) {
  if (targetIframe && targetIframe.contentWindow) {
    targetIframe.contentWindow.postMessage({
      type: 'DOM_MANIPULATION',
      ...data
    }, '*');
    
    // Save the change to local state (skip show/hide as they are handled separately)
    // Also skip saving when we're restoring state to prevent circular saves
    if (data.action !== 'show' && data.action !== 'hide' && !isRestoring) {
      saveChangeToState(data);
    }
  } else {
    updateStatus('Error: Iframe not loaded', false);
  }
}

function saveChangeToState(data) {
  const { action, selector, property, value, content } = data;
  
  switch (action) {
    case 'changeText':
      savedState.textChanges[selector] = content;
      break;
    case 'changeHTML':
      savedState.htmlChanges[selector] = content;
      break;
    case 'changeStyle':
      if (!savedState.styleChanges[selector]) {
        savedState.styleChanges[selector] = {};
      }
      savedState.styleChanges[selector][property] = value;
      break;
    case 'addClass':
      if (!savedState.classChanges[selector]) {
        savedState.classChanges[selector] = [];
      }
      if (!savedState.classChanges[selector].includes(value)) {
        savedState.classChanges[selector].push(value);
      }
      break;
    case 'removeClass':
      if (savedState.classChanges[selector]) {
        savedState.classChanges[selector] = savedState.classChanges[selector].filter(c => c !== value);
      }
      break;
  }
  
  saveCurrentState();
}

// Submit to MCP Server function
window.submitToMCP = async function() {
  // Dynamically use the current port for the MCP endpoint
  const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const endpoint = `${window.location.protocol}//${window.location.hostname}:${currentPort}/api/submit`;
  
  // Create a simplified payload with only the changes
  const payload = {
    timestamp: new Date().toISOString(),
    pageUrl: document.getElementById('targetIframe').src,
    changes: generateChangesList()
  };
  
  try {
    updateStatus('Submitting changes to MCP server...', true);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload, null, 2)
    });
    
    if (response.ok) {
      const result = await response.json();
      updateStatus(`Successfully submitted to MCP server! Response: ${result.message || 'OK'}`, true);
    } else {
      const errorText = await response.text();
      updateStatus(`MCP server error (${response.status}): ${errorText}`, false);
    }
  } catch (error) {
    updateStatus(`Failed to connect to MCP server: ${error.message}`, false);
  }
}

// Generate a clean list of changes
function generateChangesList() {
  const changes = [];
  
  // Text changes
  Object.keys(savedState.textChanges).forEach(selector => {
    changes.push({
      type: 'text',
      selector: selector,
      action: 'changed text',
      newValue: savedState.textChanges[selector]
    });
  });
  
  // Style changes
  Object.keys(savedState.styleChanges).forEach(selector => {
    Object.keys(savedState.styleChanges[selector]).forEach(property => {
      changes.push({
        type: 'style',
        selector: selector,
        action: `changed ${property}`,
        property: property,
        newValue: savedState.styleChanges[selector][property]
      });
    });
  });
  
  // HTML changes
  Object.keys(savedState.htmlChanges).forEach(selector => {
    changes.push({
      type: 'html',
      selector: selector,
      action: 'changed HTML content',
      newValue: savedState.htmlChanges[selector]
    });
  });
  
  // Class additions
  Object.keys(savedState.classChanges).forEach(selector => {
    savedState.classChanges[selector].forEach(className => {
      changes.push({
        type: 'class',
        selector: selector,
        action: 'added class',
        newValue: className
      });
    });
  });
  
  // Hidden elements
  savedState.hiddenElements.forEach(element => {
    changes.push({
      type: 'visibility',
      selector: element.selector,
      action: 'hidden element',
      elementTag: element.tagName
    });
  });
  
  return changes;
}

// Wait for iframe to load
window.addEventListener('load', () => {
  targetIframe = document.getElementById('targetIframe');
  
  // Load saved state on page load
  loadSavedState();
  
  // Listen for messages from iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'DOM_MANIPULATION_RESULT') {
      updateStatus(event.data.message, event.data.success);
    } else if (event.data.type === 'ELEMENT_SELECTED') {
      handleElementSelection(event.data.element);
    } else if (event.data.type === 'IFRAME_READY') {
      // Apply saved state when iframe is ready
      setTimeout(() => {
        applySavedState();
        // Generate dynamic controls after page loads
        setTimeout(() => {
          generateDynamicControls();
        }, 500);
      }, 100);
    } else if (event.data.type === 'PAGE_ANALYSIS') {
      // Receive page analysis data and generate controls
      generateControlsFromAnalysis(event.data.analysis);
    }
  });
});

function handleElementSelection(elementInfo) {
  selectedElementInfo = elementInfo;
  
  // Show selected element section
  document.getElementById('selectedElementSection').style.display = 'block';
  
  // Update element info display
  document.getElementById('elementTag').textContent = elementInfo.tagName;
  document.getElementById('elementId').textContent = elementInfo.id || 'none';
  document.getElementById('elementSelector').textContent = elementInfo.selector;
  document.getElementById('elementText').textContent = elementInfo.textContent;
  
  updateStatus(`Selected: ${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''}`, true);
}

function updateStatus(message, success = true) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = success ? 'status-area success' : 'status-area error';
  
  // Clear status after 3 seconds
  setTimeout(() => {
    statusElement.textContent = 'Ready to manipulate DOM...';
    statusElement.className = 'status-area';
  }, 3000);
}

// Quick action functions for selected element
window.quickEditText = function() {
  if (!selectedElementInfo) return;
  const newText = prompt('Enter new text:', selectedElementInfo.textContent);
  if (newText !== null) {
    sendMessageToIframe({
      action: 'changeText',
      selector: selectedElementInfo.selector,
      content: newText
    });
  }
}

window.quickChangeColor = function() {
  if (!selectedElementInfo) return;
  const color = prompt('Enter color (e.g., red, #ff0000, rgb(255,0,0)):', 'blue');
  if (color) {
    sendMessageToIframe({
      action: 'changeStyle',
      selector: selectedElementInfo.selector,
      property: 'color',
      value: color
    });
  }
}

window.quickChangeBg = function() {
  if (!selectedElementInfo) return;
  const colors = ['#ffeb3b', '#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'backgroundColor',
    value: color
  });
}

window.quickHide = function() {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'hide',
    selector: selectedElementInfo.selector
  });
  addToHiddenElements(selectedElementInfo);
}

window.quickHighlight = function() {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'addClass',
    selector: selectedElementInfo.selector,
    value: 'highlight'
  });
}

window.quickRemoveHighlight = function() {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'removeClass',
    selector: selectedElementInfo.selector,
    value: 'highlight'
  });
}

function addToHiddenElements(elementInfo) {
  // Don't add duplicates
  if (!hiddenElements.find(el => el.selector === elementInfo.selector)) {
    hiddenElements.push(elementInfo);
    updateHiddenElementsList();
  }
}

function removeFromHiddenElements(selector) {
  hiddenElements = hiddenElements.filter(el => el.selector !== selector);
  updateHiddenElementsList();
}

function updateHiddenElementsList() {
  const hiddenSection = document.getElementById('hiddenElementsSection');
  const hiddenList = document.getElementById('hiddenElementsList');
  
  if (hiddenElements.length === 0) {
    hiddenSection.style.display = 'none';
    return;
  }
  
  hiddenSection.style.display = 'block';
  hiddenList.innerHTML = '';
  
  hiddenElements.forEach(element => {
    const listItem = document.createElement('div');
    listItem.className = 'hidden-element-item';
    listItem.innerHTML = `
      <span class="hidden-element-info">
        ${element.tagName}${element.id ? '#' + element.id : ''}: ${element.textContent}
      </span>
      <button class="action-btn small" onclick="restoreElement('${element.selector}')">Show</button>
    `;
    hiddenList.appendChild(listItem);
  });
}

window.restoreElement = function(selector) {
  sendMessageToIframe({
    action: 'show',
    selector: selector
  });
  removeFromHiddenElements(selector);
}

window.showAllHidden = function() {
  hiddenElements.forEach(element => {
    sendMessageToIframe({
      action: 'show',
      selector: element.selector
    });
  });
  hiddenElements = [];
  updateHiddenElementsList();
}

// Export/Import state functions
window.exportState = function() {
  const stateJson = JSON.stringify(savedState, null, 2);
  const blob = new Blob([stateJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pixelpolish-state.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  updateStatus('State exported successfully', true);
}

window.importState = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedState = JSON.parse(e.target.result);
          savedState = importedState;
          hiddenElements = savedState.hiddenElements || [];
          saveCurrentState();
          updateHiddenElementsList();
          applySavedState();
          updateStatus('State imported and applied successfully', true);
        } catch (error) {
          updateStatus('Error importing state: Invalid JSON file', false);
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// Request page analysis from iframe
function generateDynamicControls() {
  if (targetIframe && targetIframe.contentWindow) {
    targetIframe.contentWindow.postMessage({
      type: 'ANALYZE_PAGE'
    }, '*');
  }
}

// Generate controls based on page analysis
function generateControlsFromAnalysis(analysis) {
  const container = document.getElementById('generatedControls');
  const section = document.getElementById('dynamicControlsSection');
  
  if (!analysis || analysis.length === 0) {
    container.innerHTML = '<p class="info-text">No analyzable elements found.</p>';
    return;
  }
  
  // Show the section
  section.style.display = 'block';
  
  let html = '<div class="dynamic-controls-grid">';
  
  // Group elements by type
  const grouped = {};
  analysis.forEach(element => {
    if (!grouped[element.type]) {
      grouped[element.type] = [];
    }
    grouped[element.type].push(element);
  });
  
  // Generate controls for each type
  Object.keys(grouped).forEach(type => {
    html += `<div class="element-type-group">`;
    html += `<h4 class="element-type-title">${type.toUpperCase()} (${grouped[type].length})</h4>`;
    
    grouped[type].forEach((element, index) => {
      const shortText = element.text.length > 30 ? element.text.substring(0, 30) + '...' : element.text;
      html += `
        <div class="element-control" data-selector="${element.selector}">
          <div class="element-info">
            <strong>${element.selector}</strong>
            <span class="element-text">${shortText}</span>
          </div>
          <div class="element-actions">
            <button class="action-btn small" onclick="selectElementInIframe('${element.selector}')">Select</button>
            ${type === 'heading' || type === 'text' ? 
              `<button class="action-btn small" onclick="quickEditElement('${element.selector}')">Edit</button>` : ''}
            <button class="action-btn small" onclick="quickStyleElement('${element.selector}')">Style</button>
            <button class="action-btn small danger" onclick="quickHideElement('${element.selector}')">Hide</button>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  });
  
  html += '</div>';
  
  // Add page-wide controls
  html += `
    <div class="page-wide-controls">
      <h4>Page-Wide Actions</h4>
      <div class="button-group">
        <button class="action-btn" onclick="changePageBackground()">Change Background</button>
        <button class="action-btn" onclick="adjustPageSpacing()">Adjust Spacing</button>
        <button class="action-btn" onclick="togglePageAnimations()">Toggle Animations</button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  updateStatus(`Generated controls for ${analysis.length} elements`, true);
}

// Dynamic control action functions
window.selectElementInIframe = function(selector) {
  sendMessageToIframe({
    action: 'selectElement',
    selector: selector
  });
}

window.quickEditElement = function(selector) {
  const newText = prompt('Enter new text:');
  if (newText !== null) {
    sendMessageToIframe({
      action: 'changeText',
      selector: selector,
      content: newText
    });
  }
}

window.quickStyleElement = function(selector) {
  const property = prompt('CSS Property (e.g., color, backgroundColor, fontSize):');
  if (property) {
    const value = prompt(`Value for ${property}:`);
    if (value) {
      sendMessageToIframe({
        action: 'changeStyle',
        selector: selector,
        property: property,
        value: value
      });
    }
  }
}

window.quickHideElement = function(selector) {
  if (confirm(`Hide element "${selector}"?`)) {
    sendMessageToIframe({
      action: 'hide',
      selector: selector
    });
  }
}

window.changePageBackground = function() {
  const colors = ['#f8f9fa', '#e9ecef', '#fff3cd', '#d1ecf1', '#d4edda', '#f8d7da'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  sendMessageToIframe({
    action: 'changeStyle',
    selector: 'body',
    property: 'backgroundColor',
    value: color
  });
}

window.adjustPageSpacing = function() {
  const spacing = prompt('Enter spacing value (e.g., 10px, 20px):');
  if (spacing) {
    sendMessageToIframe({
      action: 'changeStyle',
      selector: 'body',
      property: 'padding',
      value: spacing
    });
  }
}

window.togglePageAnimations = function() {
  sendMessageToIframe({
    action: 'changeStyle',
    selector: '*',
    property: 'animationPlayState',
    value: 'paused'
  });
}

// AI Assistant Function
window.askAI = async function() {
  if (!selectedElementInfo) {
    updateAIStatus('Please select an element first', false);
    return;
  }
  
  const request = document.getElementById('aiRequest').value.trim();
  if (!request) {
    updateAIStatus('Please enter a request', false);
    return;
  }
  
  updateAIStatus('Processing your request...', true);
  
  try {
    // Process the natural language request
    const actions = await processAIRequest(request, selectedElementInfo);
    
    if (actions.length === 0) {
      updateAIStatus('Could not understand the request. Try being more specific.', false);
      return;
    }
    
    // Apply each action
    for (const action of actions) {
      sendMessageToIframe(action);
    }
    
    updateAIStatus(`Applied ${actions.length} change(s) successfully!`, true);
    document.getElementById('aiRequest').value = ''; // Clear input
    
  } catch (error) {
    updateAIStatus(`Error: ${error.message}`, false);
  }
}

function updateAIStatus(message, success) {
  const statusElement = document.getElementById('aiStatus');
  statusElement.textContent = message;
  statusElement.style.color = success ? '#28a745' : '#dc3545';
}

// Process natural language AI requests
async function processAIRequest(request, elementInfo) {
  // Get API key from config
  const apiKey = CONFIG.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Please set your OpenAI API key in config.js');
  }

  const systemPrompt = `You are a web design assistant. The user has selected an HTML element and wants to modify it using natural language.

Selected element info:
- Tag: ${elementInfo.tagName}
- ID: ${elementInfo.id || 'none'}
- Classes: ${elementInfo.className || 'none'}
- Current text: ${elementInfo.textContent}
- CSS Selector: ${elementInfo.selector}

Available actions you can return:
1. changeText: Change text content
2. changeStyle: Modify CSS properties (color, backgroundColor, fontSize, fontWeight, fontStyle, textDecoration, textAlign, etc.)
3. changeHTML: Replace HTML content
4. addClass: Add CSS class
5. removeClass: Remove CSS class
6. hide: Hide element
7. show: Show element

Return ONLY a JSON array of actions. Each action should have:
- action: the action type
- selector: "${elementInfo.selector}" (always use this exact selector)
- For changeText: content (the new text)
- For changeStyle: property and value
- For changeHTML: content (the new HTML)
- For addClass/removeClass: value (the class name)

Examples:
User: "make this red and bold"
Response: [
  {"action": "changeStyle", "selector": "${elementInfo.selector}", "property": "color", "value": "red"},
  {"action": "changeStyle", "selector": "${elementInfo.selector}", "property": "fontWeight", "value": "bold"}
]

User: "change text to Hello World"
Response: [
  {"action": "changeText", "selector": "${elementInfo.selector}", "content": "Hello World"}
]`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request }
      ],
      max_tokens: 500,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your API key.');
    }
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;

  try {
    // Parse the JSON response from AI
    const actions = JSON.parse(aiResponse);
    
    // Validate that it's an array
    if (!Array.isArray(actions)) {
      throw new Error('AI response is not an array');
    }

    // Validate each action has required fields
    for (const action of actions) {
      if (!action.action || !action.selector) {
        throw new Error('Invalid action format');
      }
    }

    return actions;
  } catch (parseError) {
    console.error('AI Response:', aiResponse);
    throw new Error('Could not parse AI response. Please try rephrasing your request.');
  }
}

// Collapsible sections functionality
window.toggleSection = function(sectionId) {
  const content = document.getElementById(sectionId);
  const header = content.parentElement.querySelector('.section-header');
  const icon = header.querySelector('.toggle-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
    header.classList.remove('collapsed');
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
    header.classList.add('collapsed');
  }
}