import './style.css'
import pixelPolishLogo from '/pixelpolish-logo.webp'

// Get URL from query parameters or use default
function getTargetUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url');
  return targetUrl || 'http://localhost:8081/landing-page';
}

document.querySelector("#app").innerHTML = `
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
          <h3 class="section-header collapsed" onclick="toggleSection('selectedElement')">
            <span>Selected Element</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="selectedElement" style="display: none;">
            <div id="elementInfo" class="element-info">
              <p><strong>Tag:</strong> <span id="elementTag">-</span></p>
              <p><strong>ID:</strong> <span id="elementId">-</span></p>
              <p><strong>Selector:</strong> <span id="elementSelector">-</span></p>
              <p><strong>Text:</strong> <span id="elementText">-</span></p>
            </div>
            
            <!-- Typography Controls -->
            <div class="control-subsection">
              <h4 class="subsection-header" onclick="toggleSubsection('typography')">
                <span>Typography</span>
                <span class="toggle-icon">▶</span>
              </h4>
              <div class="subsection-content" id="typography" style="display: none;">
                <div class="control-grid">
                  <div class="control-item">
                    <label>Font Size:</label>
                    <input type="range" id="fontSize" min="8" max="72" value="16" oninput="updateFontSize(this.value)">
                    <span id="fontSizeValue">16px</span>
                  </div>
                  <div class="control-item">
                    <label>Font Weight:</label>
                    <select id="fontWeight" onchange="updateFontWeight(this.value)">
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Lighter</option>
                      <option value="100">100</option>
                      <option value="400">400</option>
                      <option value="700">700</option>
                      <option value="900">900</option>
                    </select>
                  </div>
                  <div class="control-item">
                    <label>Font Family:</label>
                    <select id="fontFamily" onchange="updateFontFamily(this.value)">
                      <option value="inherit">Inherit</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                    </select>
                  </div>
                  <div class="control-item">
                    <label>Text Color:</label>
                    <input type="color" id="textColor" onchange="updateTextColor(this.value)">
                  </div>
                  <div class="control-item">
                    <label>Text Align:</label>
                    <select id="textAlign" onchange="updateTextAlign(this.value)">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="justify">Justify</option>
                    </select>
                  </div>
                  <div class="control-item">
                    <label>Line Height:</label>
                    <input type="range" id="lineHeight" min="0.5" max="3" step="0.1" value="1.5" oninput="updateLineHeight(this.value)">
                    <span id="lineHeightValue">1.5</span>
                  </div>
                </div>
                <div class="button-group">
                  <button class="action-btn" onclick="quickEditText()">Edit Text</button>
                  <button class="action-btn" onclick="toggleTextDecoration('underline')">Underline</button>
                  <button class="action-btn" onclick="toggleTextDecoration('italic')">Italic</button>
                </div>
              </div>
            </div>

            <!-- Layout Controls -->
            <div class="control-subsection">
              <h4 class="subsection-header" onclick="toggleSubsection('layout')">
                <span>Layout & Spacing</span>
                <span class="toggle-icon">▶</span>
              </h4>
              <div class="subsection-content" id="layout" style="display: none;">
                <div class="control-grid">
                  <div class="control-item">
                    <label>Width:</label>
                    <input type="text" id="width" placeholder="auto" onchange="updateDimension('width', this.value)">
                  </div>
                  <div class="control-item">
                    <label>Height:</label>
                    <input type="text" id="height" placeholder="auto" onchange="updateDimension('height', this.value)">
                  </div>
                  <div class="control-item">
                    <label>Display:</label>
                    <select id="display" onchange="updateDisplay(this.value)">
                      <option value="block">Block</option>
                      <option value="inline">Inline</option>
                      <option value="inline-block">Inline Block</option>
                      <option value="flex">Flex</option>
                      <option value="grid">Grid</option>
                      <option value="none">None (Hide)</option>
                    </select>
                  </div>
                  <div class="control-item">
                    <label>Position:</label>
                    <select id="position" onchange="updatePosition(this.value)">
                      <option value="static">Static</option>
                      <option value="relative">Relative</option>
                      <option value="absolute">Absolute</option>
                      <option value="fixed">Fixed</option>
                      <option value="sticky">Sticky</option>
                    </select>
                  </div>
                </div>
                <div class="spacing-controls">
                  <h5>Margin</h5>
                  <div class="spacing-grid">
                    <input type="text" id="marginTop" placeholder="0" onchange="updateSpacing('margin-top', this.value)">
                    <input type="text" id="marginRight" placeholder="0" onchange="updateSpacing('margin-right', this.value)">
                    <input type="text" id="marginBottom" placeholder="0" onchange="updateSpacing('margin-bottom', this.value)">
                    <input type="text" id="marginLeft" placeholder="0" onchange="updateSpacing('margin-left', this.value)">
                  </div>
                  <h5>Padding</h5>
                  <div class="spacing-grid">
                    <input type="text" id="paddingTop" placeholder="0" onchange="updateSpacing('padding-top', this.value)">
                    <input type="text" id="paddingRight" placeholder="0" onchange="updateSpacing('padding-right', this.value)">
                    <input type="text" id="paddingBottom" placeholder="0" onchange="updateSpacing('padding-bottom', this.value)">
                    <input type="text" id="paddingLeft" placeholder="0" onchange="updateSpacing('padding-left', this.value)">
                  </div>
                </div>
              </div>
            </div>

            <!-- Appearance Controls -->
            <div class="control-subsection">
              <h4 class="subsection-header" onclick="toggleSubsection('appearance')">
                <span>Appearance</span>
                <span class="toggle-icon">▶</span>
              </h4>
              <div class="subsection-content" id="appearance" style="display: none;">
                <div class="control-grid">
                  <div class="control-item">
                    <label>Background Color:</label>
                    <input type="color" id="backgroundColor" onchange="updateBackgroundColor(this.value)">
                  </div>
                  <div class="control-item">
                    <label>Opacity:</label>
                    <input type="range" id="opacity" min="0" max="1" step="0.1" value="1" oninput="updateOpacity(this.value)">
                    <span id="opacityValue">100%</span>
                  </div>
                  <div class="control-item">
                    <label>Border Width:</label>
                    <input type="range" id="borderWidth" min="0" max="10" value="0" oninput="updateBorderWidth(this.value)">
                    <span id="borderWidthValue">0px</span>
                  </div>
                  <div class="control-item">
                    <label>Border Color:</label>
                    <input type="color" id="borderColor" onchange="updateBorderColor(this.value)">
                  </div>
                  <div class="control-item">
                    <label>Border Radius:</label>
                    <input type="range" id="borderRadius" min="0" max="50" value="0" oninput="updateBorderRadius(this.value)">
                    <span id="borderRadiusValue">0px</span>
                  </div>
                  <div class="control-item">
                    <label>Box Shadow:</label>
                    <select id="boxShadow" onchange="updateBoxShadow(this.value)">
                      <option value="none">None</option>
                      <option value="0 2px 4px rgba(0,0,0,0.1)">Light</option>
                      <option value="0 4px 8px rgba(0,0,0,0.2)">Medium</option>
                      <option value="0 8px 16px rgba(0,0,0,0.3)">Heavy</option>
                    </select>
                  </div>
                </div>
                <div class="button-group">
                  <button class="action-btn" onclick="quickChangeBg()">Random Background</button>
                  <button class="action-btn" onclick="quickHighlight()">Highlight</button>
                  <button class="action-btn" onclick="quickRemoveHighlight()">Remove Highlight</button>
                </div>
              </div>
            </div>

            <!-- Transform & Effects -->
            <div class="control-subsection">
              <h4 class="subsection-header" onclick="toggleSubsection('effects')">
                <span>Transform & Effects</span>
                <span class="toggle-icon">▶</span>
              </h4>
              <div class="subsection-content" id="effects" style="display: none;">
                <div class="control-grid">
                  <div class="control-item">
                    <label>Scale:</label>
                    <input type="range" id="scale" min="0.5" max="2" step="0.1" value="1" oninput="updateTransform()">
                    <span id="scaleValue">1</span>
                  </div>
                  <div class="control-item">
                    <label>Rotate:</label>
                    <input type="range" id="rotate" min="-180" max="180" value="0" oninput="updateTransform()">
                    <span id="rotateValue">0°</span>
                  </div>
                  <div class="control-item">
                    <label>Blur:</label>
                    <input type="range" id="blur" min="0" max="10" value="0" oninput="updateFilter()">
                    <span id="blurValue">0px</span>
                  </div>
                  <div class="control-item">
                    <label>Brightness:</label>
                    <input type="range" id="brightness" min="0" max="2" step="0.1" value="1" oninput="updateFilter()">
                    <span id="brightnessValue">100%</span>
                  </div>
                </div>
                <div class="button-group">
                  <button class="action-btn" onclick="resetTransforms()">Reset Transforms</button>
                  <button class="action-btn" onclick="animateElement()">Add Animation</button>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="control-subsection">
              <h4>Quick Actions</h4>
              <div class="button-group">
                <button class="action-btn danger" onclick="quickHide()">Hide Element</button>
                <button class="action-btn" onclick="duplicateElement()">Duplicate</button>
                <button class="action-btn" onclick="copyElementStyles()">Copy Styles</button>
                <button class="action-btn" onclick="resetElementStyles()">Reset Styles</button>
                <button class="action-btn danger" onclick="clearSavedState()">Reset All Changes</button>
              </div>
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
`;

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
  
  // Prepare the comprehensive payload for LLM processing
  const payload = {
    timestamp: new Date().toISOString(),
    url: document.getElementById('targetIframe').src,
    
    // Raw changes data (exactly like the export JSON)
    changes: {
      textChanges: savedState.textChanges,
      styleChanges: savedState.styleChanges,
      htmlChanges: savedState.htmlChanges,
      classChanges: savedState.classChanges,
      hiddenElements: savedState.hiddenElements
    },
    
    // Detailed descriptions for LLM understanding
    changeDescriptions: generateDetailedDescriptions(),
    
    // Summary statistics
    summary: generateChangeSummary(),
    
    // Context about the page being modified
    pageContext: {
      title: 'PixelPolish Landing Page',
      type: 'landing-page',
      mainElements: [
        { selector: '.hero h1', type: 'heading', description: 'Main hero title' },
        { selector: '.hero p', type: 'text', description: 'Hero description paragraph' },
        { selector: '.cta-button', type: 'button', description: 'Call-to-action buttons' },
        { selector: '.section-title', type: 'heading', description: 'Section titles' },
        { selector: '.feature-card h3', type: 'heading', description: 'Feature card titles' },
        { selector: '.feature-card p', type: 'text', description: 'Feature descriptions' },
        { selector: '.demo-text h2', type: 'heading', description: 'Demo section title' },
        { selector: '.demo-text p', type: 'text', description: 'Demo description paragraphs' },
        { selector: '.footer', type: 'container', description: 'Footer section' }
      ]
    },
    
    // Actionable instructions for LLM
    instructions: generateLLMInstructions()
  };
  
  try {
    updateStatus('Submitting detailed changes to MCP server...', true);
    
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

// Generate detailed descriptions for each change type
function generateDetailedDescriptions() {
  const descriptions = {
    textModifications: [],
    styleModifications: [],
    contentModifications: [],
    classModifications: [],
    hiddenElements: [],
    overallEffect: ""
  };
  
  // Text changes descriptions
  Object.keys(savedState.textChanges).forEach(selector => {
    descriptions.textModifications.push({
      selector: selector,
      newText: savedState.textChanges[selector],
      action: `Changed text content of "${selector}" to "${savedState.textChanges[selector]}"`
    });
  });
  
  // Style changes descriptions
  Object.keys(savedState.styleChanges).forEach(selector => {
    Object.keys(savedState.styleChanges[selector]).forEach(property => {
      const value = savedState.styleChanges[selector][property];
      descriptions.styleModifications.push({
        selector: selector,
        property: property,
        value: value,
        action: `Applied CSS style "${property}: ${value}" to "${selector}"`
      });
    });
  });
  
  // HTML changes descriptions
  Object.keys(savedState.htmlChanges).forEach(selector => {
    descriptions.contentModifications.push({
      selector: selector,
      newHTML: savedState.htmlChanges[selector],
      action: `Replaced HTML content of "${selector}" with custom HTML`
    });
  });
  
  // Class changes descriptions
  Object.keys(savedState.classChanges).forEach(selector => {
    savedState.classChanges[selector].forEach(className => {
      descriptions.classModifications.push({
        selector: selector,
        className: className,
        action: `Added CSS class "${className}" to "${selector}"`
      });
    });
  });
  
  // Hidden elements descriptions
  savedState.hiddenElements.forEach(element => {
    descriptions.hiddenElements.push({
      selector: element.selector,
      elementType: element.tagName,
      action: `Hidden element "${element.selector}" (${element.tagName})`
    });
  });
  
  // Generate overall effect description
  const totalChanges = descriptions.textModifications.length + 
                      descriptions.styleModifications.length + 
                      descriptions.contentModifications.length + 
                      descriptions.classModifications.length + 
                      descriptions.hiddenElements.length;
  
  descriptions.overallEffect = `Applied ${totalChanges} total modifications to the webpage, including ${descriptions.textModifications.length} text changes, ${descriptions.styleModifications.length} style changes, ${descriptions.contentModifications.length} content replacements, ${descriptions.classModifications.length} class additions, and ${descriptions.hiddenElements.length} hidden elements.`;
  
  return descriptions;
}

// Generate LLM-friendly instructions
function generateLLMInstructions() {
  const instructions = {
    purpose: "These changes represent DOM modifications made through the PixelPolish interface",
    howToUse: "Use this data to understand what changes were applied and potentially recreate or modify them",
    changeTypes: {
      textChanges: "Direct text content replacements - apply these by setting element.textContent",
      styleChanges: "CSS style modifications - apply these by setting element.style[property] = value",
      htmlChanges: "HTML content replacements - apply these by setting element.innerHTML",
      classChanges: "CSS class additions - apply these by using element.classList.add(className)",
      hiddenElements: "Elements that were hidden - apply these by setting element.style.display = 'none'"
    },
    context: "All changes were made to an interactive demo page with standard HTML elements",
    suggestedActions: generateSuggestedActions()
  };
  
  return instructions;
}

function generateSuggestedActions() {
  const actions = [];
  
  if (Object.keys(savedState.textChanges).length > 0) {
    actions.push("Apply text modifications to update content messaging");
  }
  
  if (Object.keys(savedState.styleChanges).length > 0) {
    actions.push("Apply style changes to modify visual appearance");
  }
  
  if (Object.keys(savedState.htmlChanges).length > 0) {
    actions.push("Replace HTML content to add dynamic elements");
  }
  
  if (Object.keys(savedState.classChanges).length > 0) {
    actions.push("Add CSS classes for styling or behavioral changes");
  }
  
  if (savedState.hiddenElements.length > 0) {
    actions.push("Hide specified elements to modify page layout");
  }
  
  return actions;
}

// Generate a summary of changes for the MCP server
function generateChangeSummary() {
  const summary = {
    totalChanges: 0,
    textChanges: Object.keys(savedState.textChanges).length,
    styleChanges: Object.keys(savedState.styleChanges).length,
    htmlChanges: Object.keys(savedState.htmlChanges).length,
    classChanges: Object.keys(savedState.classChanges).length,
    hiddenElements: savedState.hiddenElements.length
  };
  
  summary.totalChanges = summary.textChanges + summary.styleChanges + 
                        summary.htmlChanges + summary.classChanges + summary.hiddenElements;
  
  return summary;
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
      }, 100);
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

// Enhanced Control Panel Functions

// Typography Controls
window.updateFontSize = function(value) {
  if (!selectedElementInfo) return;
  document.getElementById('fontSizeValue').textContent = value + 'px';
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'fontSize',
    value: value + 'px'
  });
}

window.updateFontWeight = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'fontWeight',
    value: value
  });
}

window.updateFontFamily = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'fontFamily',
    value: value
  });
}

window.updateTextColor = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'color',
    value: value
  });
}

window.updateTextAlign = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'textAlign',
    value: value
  });
}

window.updateLineHeight = function(value) {
  if (!selectedElementInfo) return;
  document.getElementById('lineHeightValue').textContent = value;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'lineHeight',
    value: value
  });
}

window.toggleTextDecoration = function(decoration) {
  if (!selectedElementInfo) return;
  if (decoration === 'italic') {
    sendMessageToIframe({
      action: 'changeStyle',
      selector: selectedElementInfo.selector,
      property: 'fontStyle',
      value: 'italic'
    });
  } else if (decoration === 'underline') {
    sendMessageToIframe({
      action: 'changeStyle',
      selector: selectedElementInfo.selector,
      property: 'textDecoration',
      value: 'underline'
    });
  }
}

// Layout Controls
window.updateDimension = function(property, value) {
  if (!selectedElementInfo) return;
  if (value && !value.includes('px') && !value.includes('%') && !value.includes('auto') && !value.includes('em')) {
    value = value + 'px';
  }
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: property,
    value: value
  });
}

window.updateDisplay = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'display',
    value: value
  });
}

window.updatePosition = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'position',
    value: value
  });
}

window.updateSpacing = function(property, value) {
  if (!selectedElementInfo) return;
  if (value && !value.includes('px') && !value.includes('%') && !value.includes('auto') && !value.includes('em')) {
    value = value + 'px';
  }
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: property,
    value: value
  });
}

// Appearance Controls
window.updateBackgroundColor = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'backgroundColor',
    value: value
  });
}

window.updateOpacity = function(value) {
  if (!selectedElementInfo) return;
  document.getElementById('opacityValue').textContent = Math.round(value * 100) + '%';
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'opacity',
    value: value
  });
}

window.updateBorderWidth = function(value) {
  if (!selectedElementInfo) return;
  document.getElementById('borderWidthValue').textContent = value + 'px';
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'borderWidth',
    value: value + 'px'
  });
  // Set default border style if width > 0
  if (value > 0) {
    sendMessageToIframe({
      action: 'changeStyle',
      selector: selectedElementInfo.selector,
      property: 'borderStyle',
      value: 'solid'
    });
  }
}

window.updateBorderColor = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'borderColor',
    value: value
  });
}

window.updateBorderRadius = function(value) {
  if (!selectedElementInfo) return;
  document.getElementById('borderRadiusValue').textContent = value + 'px';
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'borderRadius',
    value: value + 'px'
  });
}

window.updateBoxShadow = function(value) {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'boxShadow',
    value: value
  });
}

// Transform & Effects Controls
window.updateTransform = function() {
  if (!selectedElementInfo) return;
  const scale = document.getElementById('scale').value;
  const rotate = document.getElementById('rotate').value;
  
  document.getElementById('scaleValue').textContent = scale;
  document.getElementById('rotateValue').textContent = rotate + '°';
  
  const transform = `scale(${scale}) rotate(${rotate}deg)`;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'transform',
    value: transform
  });
}

window.updateFilter = function() {
  if (!selectedElementInfo) return;
  const blur = document.getElementById('blur').value;
  const brightness = document.getElementById('brightness').value;
  
  document.getElementById('blurValue').textContent = blur + 'px';
  document.getElementById('brightnessValue').textContent = Math.round(brightness * 100) + '%';
  
  const filter = `blur(${blur}px) brightness(${brightness})`;
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'filter',
    value: filter
  });
}

window.resetTransforms = function() {
  if (!selectedElementInfo) return;
  document.getElementById('scale').value = 1;
  document.getElementById('rotate').value = 0;
  document.getElementById('blur').value = 0;
  document.getElementById('brightness').value = 1;
  updateTransform();
  updateFilter();
}

window.animateElement = function() {
  if (!selectedElementInfo) return;
  const animations = [
    'pulse 2s infinite',
    'bounce 1s',
    'shake 0.5s',
    'fadeIn 1s',
    'slideIn 0.5s'
  ];
  const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selectedElementInfo.selector,
    property: 'animation',
    value: randomAnimation
  });
}

// Additional Quick Actions
window.duplicateElement = function() {
  if (!selectedElementInfo) return;
  sendMessageToIframe({
    action: 'duplicateElement',
    selector: selectedElementInfo.selector
  });
}

window.copyElementStyles = function() {
  if (!selectedElementInfo) return;
  // Store styles in localStorage for pasting
  localStorage.setItem('pixelpolish-copied-styles', JSON.stringify({
    selector: selectedElementInfo.selector,
    timestamp: Date.now()
  }));
  updateStatus('Element styles copied! Select another element and use "Paste Styles"', true);
}

window.pasteElementStyles = function() {
  if (!selectedElementInfo) return;
  const copiedStyles = localStorage.getItem('pixelpolish-copied-styles');
  if (copiedStyles) {
    const parsed = JSON.parse(copiedStyles);
    // This would need implementation in the iframe to copy computed styles
    sendMessageToIframe({
      action: 'copyStyles',
      fromSelector: parsed.selector,
      toSelector: selectedElementInfo.selector
    });
  } else {
    updateStatus('No styles copied yet!', false);
  }
}

window.resetElementStyles = function() {
  if (!selectedElementInfo) return;
  if (confirm('Reset all styles for this element?')) {
    sendMessageToIframe({
      action: 'resetStyles',
      selector: selectedElementInfo.selector
    });
    // Reset all control values
    resetControlValues();
  }
}

function resetControlValues() {
  // Reset all control inputs to default values
  const controls = [
    { id: 'fontSize', value: 16 },
    { id: 'fontWeight', value: 'normal' },
    { id: 'fontFamily', value: 'inherit' },
    { id: 'textAlign', value: 'left' },
    { id: 'lineHeight', value: 1.5 },
    { id: 'width', value: '' },
    { id: 'height', value: '' },
    { id: 'display', value: 'block' },
    { id: 'position', value: 'static' },
    { id: 'opacity', value: 1 },
    { id: 'borderWidth', value: 0 },
    { id: 'borderRadius', value: 0 },
    { id: 'boxShadow', value: 'none' },
    { id: 'scale', value: 1 },
    { id: 'rotate', value: 0 },
    { id: 'blur', value: 0 },
    { id: 'brightness', value: 1 }
  ];
  
  controls.forEach(control => {
    const element = document.getElementById(control.id);
    if (element) {
      element.value = control.value;
    }
  });
  
  // Update display values
  document.getElementById('fontSizeValue').textContent = '16px';
  document.getElementById('lineHeightValue').textContent = '1.5';
  document.getElementById('opacityValue').textContent = '100%';
  document.getElementById('borderWidthValue').textContent = '0px';
  document.getElementById('borderRadiusValue').textContent = '0px';
  document.getElementById('scaleValue').textContent = '1';
  document.getElementById('rotateValue').textContent = '0°';
  document.getElementById('blurValue').textContent = '0px';
  document.getElementById('brightnessValue').textContent = '100%';
}

// Subsection toggle functionality
window.toggleSubsection = function(subsectionId) {
  const content = document.getElementById(subsectionId);
  const header = content.parentElement.querySelector('.subsection-header');
  const icon = header.querySelector('.toggle-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
  }
}