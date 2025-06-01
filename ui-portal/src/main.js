import './style.css'
import pixelPolishLogo from '/pixelpolish-logo.webp'

document.querySelector('#app').innerHTML = `
  <div>
    <div class="header">
      <img src="${pixelPolishLogo}" class="logo pixelpolish" alt="PixelPolish logo" />
    </div>

    <div class="main-content">
      <div class="control-panel">
        <h2>Control Panel</h2>
        
        <!-- Quick Actions -->
        <div class="control-section">
          <h3 class="section-header collapsed" onclick="toggleSection('quickActions')">
            <span>Quick Actions</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="quickActions" style="display: none;">
            <div class="quick-actions">
              <button class="action-btn" onclick="changeTitle()">Change Title</button>
              <button class="action-btn" onclick="changeBackground()">Change Background</button>
              <button class="action-btn" onclick="addContent()">Add Content</button>
              <button class="action-btn" onclick="highlightText()">Highlight Text</button>
              <button class="action-btn" onclick="hideSection()">Hide Section</button>
              <button class="action-btn" onclick="showSection()">Show Section</button>
            </div>
          </div>
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
            <div class="quick-actions">
              <button class="action-btn" onclick="quickEditText()">Edit Text</button>
              <button class="action-btn" onclick="quickChangeColor()">Change Color</button>
              <button class="action-btn" onclick="quickChangeBg()">Change Background</button>
              <button class="action-btn" onclick="quickHide()">Hide</button>
              <button class="action-btn" onclick="quickHighlight()">Highlight</button>
              <button class="action-btn" onclick="quickRemoveHighlight()">Remove Highlight</button>
            </div>
          </div>
        </div>

        <!-- Text Manipulation -->
        <div class="control-section">
          <h3 class="section-header collapsed" onclick="toggleSection('textManipulation')">
            <span>Text Manipulation</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="textManipulation" style="display: none;">
            <div class="form-group">
              <label>Element Selector:</label>
              <select id="textSelector">
                <option value="#main-title">Main Title</option>
                <option value="#description">Description</option>
                <option value="#section-title">Section Title</option>
                <option value="#demo-text">Demo Text</option>
                <option value="#highlight-text">Highlighted Text</option>
              </select>
            </div>
            <div class="form-group">
              <label>New Text:</label>
              <input type="text" id="newText" placeholder="Enter new text...">
            </div>
            <button class="action-btn" onclick="changeElementText()">Update Text</button>
          </div>
        </div>

        <!-- Style Manipulation -->
        <div class="control-section">
          <h3 class="section-header collapsed" onclick="toggleSection('styleManipulation')">
            <span>Style Manipulation</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="styleManipulation" style="display: none;">
            <div class="form-group">
              <label>Element Selector:</label>
              <input type="text" id="styleSelector" placeholder="e.g., #main-title, .highlight, body">
            </div>
            <div class="form-group">
              <label>CSS Property:</label>
              <select id="cssProperty">
                <option value="color">Text Color</option>
                <option value="backgroundColor">Background Color</option>
                <option value="fontSize">Font Size</option>
                <option value="fontWeight">Font Weight</option>
                <option value="border">Border</option>
                <option value="padding">Padding</option>
                <option value="margin">Margin</option>
                <option value="transform">Transform</option>
                <option value="opacity">Opacity</option>
              </select>
            </div>
            <div class="form-group">
              <label>Value:</label>
              <input type="text" id="cssValue" placeholder="e.g., red, 20px, bold">
            </div>
            <button class="action-btn" onclick="changeElementStyle()">Apply Style</button>
          </div>
        </div>

        <!-- Content Manipulation -->
        <div class="control-section">
          <h3 class="section-header collapsed" onclick="toggleSection('contentManipulation')">
            <span>Content Manipulation</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="contentManipulation" style="display: none;">
            <div class="form-group">
              <label>Target:</label>
              <select id="contentTarget">
                <option value="#dynamic-content">Dynamic Content Area</option>
                <option value="#demo-list">Demo List</option>
                <option value="#footer">Footer</option>
              </select>
            </div>
            <div class="form-group">
              <label>HTML Content:</label>
              <textarea id="htmlContent" placeholder="Enter HTML content..."></textarea>
            </div>
            <button class="action-btn" onclick="updateContent()">Update Content</button>
          </div>
        </div>

        <!-- Advanced Controls -->
        <div class="control-section">
          <h3 class="section-header collapsed" onclick="toggleSection('advancedControls')">
            <span>Advanced Controls</span>
            <span class="toggle-icon">▶</span>
          </h3>
          <div class="section-content" id="advancedControls" style="display: none;">
            <div class="form-group">
              <label>CSS Class to Add/Remove:</label>
              <input type="text" id="cssClass" placeholder="e.g., highlight, hidden">
            </div>
            <div class="form-group">
              <label>Target Selector:</label>
              <input type="text" id="classTarget" placeholder="e.g., #main-title">
            </div>
            <div class="button-group">
              <button class="action-btn" onclick="addClass()">Add Class</button>
              <button class="action-btn" onclick="removeClass()">Remove Class</button>
            </div>
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
            <div class="form-group">
              <label>MCP Server Endpoint:</label>
              <input type="text" id="mcpEndpoint" placeholder="http://localhost:3000/api/submit" value="http://localhost:3000/api/submit">
            </div>
            <div class="button-group">
              <button class="action-btn" onclick="submitToMCP()">Submit to MCP</button>
              <button class="action-btn" onclick="applySavedState()">Restore Changes</button>
            </div>
            <div class="button-group">
              <button class="action-btn danger" onclick="clearSavedState()">Reset All</button>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="control-section">
          <h3>Status</h3>
          <div id="status" class="status-area">Ready to manipulate DOM...</div>
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
      </div>

      <div class="iframe-container">
        <h2>Target Website</h2>
        <iframe 
          id="targetIframe"
          src="./demo-page.html" 
          width="900" 
          height="700" 
          frameborder="0"
          title="Interactive Demo Page">
        </iframe>
      </div>
    </div>
  </div>
`

// DOM Manipulation Functions
let targetIframe;
let selectedElementInfo = null;
let hiddenElements = [];
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
  if (saved) {
    savedState = JSON.parse(saved);
    hiddenElements = savedState.hiddenElements || [];
    updateHiddenElementsList();
  }
}

// Save current state to localStorage
function saveCurrentState() {
  savedState.hiddenElements = hiddenElements;
  localStorage.setItem('pixelpolish-state', JSON.stringify(savedState));
  updateStatus('Changes saved to browser storage', true);
}

// Apply saved state to the demo page
function applySavedState() {
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
}

// Clear all saved state
window.clearSavedState = function() {
  if (confirm('Are you sure you want to clear all saved changes? This will reset everything to the original state.')) {
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
    location.reload(); // Reload to reset everything
  }
}

// Enhanced sendMessageToIframe that saves state
function sendMessageToIframe(data) {
  if (targetIframe && targetIframe.contentWindow) {
    targetIframe.contentWindow.postMessage({
      type: 'DOM_MANIPULATION',
      ...data
    }, '*');
    
    // Save the change to local state (skip show/hide as they are handled separately)
    if (data.action !== 'show' && data.action !== 'hide') {
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

// Quick Action Functions
window.changeTitle = function() {
  sendMessageToIframe({
    action: 'changeText',
    selector: '#main-title',
    content: 'Modified Example Domain!'
  });
}

window.changeBackground = function() {
  sendMessageToIframe({
    action: 'changeStyle',
    selector: 'body',
    property: 'backgroundColor',
    value: '#' + Math.floor(Math.random()*16777215).toString(16)
  });
}

window.addContent = function() {
  const randomContent = [
    '<p><strong>New content added!</strong> This was dynamically inserted.</p>',
    '<div style="padding: 10px; background: #e3f2fd; border-radius: 4px;">📦 Dynamic content block</div>',
    '<ul><li>Dynamically added item 1</li><li>Dynamically added item 2</li></ul>'
  ];
  
  sendMessageToIframe({
    action: 'changeHTML',
    selector: '#dynamic-content',
    content: randomContent[Math.floor(Math.random() * randomContent.length)]
  });
}

window.highlightText = function() {
  sendMessageToIframe({
    action: 'changeStyle',
    selector: '#highlight-text',
    property: 'backgroundColor',
    value: '#ff4444'
  });
}

window.hideSection = function() {
  const elementInfo = {
    selector: '.demo-section',
    tagName: 'div',
    id: '',
    textContent: 'Demo Section'
  };
  sendMessageToIframe({
    action: 'hide',
    selector: '.demo-section'
  });
  addToHiddenElements(elementInfo);
}

window.showSection = function() {
  sendMessageToIframe({
    action: 'show',
    selector: '.demo-section'
  });
}

// Form-based Functions
window.changeElementText = function() {
  const selector = document.getElementById('textSelector').value;
  const newText = document.getElementById('newText').value;
  
  if (!newText.trim()) {
    updateStatus('Please enter text to change', false);
    return;
  }
  
  sendMessageToIframe({
    action: 'changeText',
    selector: selector,
    content: newText
  });
}

window.changeElementStyle = function() {
  const selector = document.getElementById('styleSelector').value;
  const property = document.getElementById('cssProperty').value;
  const value = document.getElementById('cssValue').value;
  
  if (!selector.trim() || !value.trim()) {
    updateStatus('Please fill in all style fields', false);
    return;
  }
  
  sendMessageToIframe({
    action: 'changeStyle',
    selector: selector,
    property: property,
    value: value
  });
}

window.updateContent = function() {
  const target = document.getElementById('contentTarget').value;
  const content = document.getElementById('htmlContent').value;
  
  if (!content.trim()) {
    updateStatus('Please enter HTML content', false);
    return;
  }
  
  sendMessageToIframe({
    action: 'changeHTML',
    selector: target,
    content: content
  });
}

window.addClass = function() {
  const className = document.getElementById('cssClass').value;
  const target = document.getElementById('classTarget').value;
  
  if (!className.trim() || !target.trim()) {
    updateStatus('Please enter both class name and target selector', false);
    return;
  }
  
  sendMessageToIframe({
    action: 'addClass',
    selector: target,
    value: className
  });
}

window.removeClass = function() {
  const className = document.getElementById('cssClass').value;
  const target = document.getElementById('classTarget').value;
  
  if (!className.trim() || !target.trim()) {
    updateStatus('Please enter both class name and target selector', false);
    return;
  }
  
  sendMessageToIframe({
    action: 'removeClass',
    selector: target,
    value: className
  });
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

// Submit to MCP Server function
window.submitToMCP = async function() {
  const endpoint = document.getElementById('mcpEndpoint').value;
  
  if (!endpoint.trim()) {
    updateStatus('Please enter MCP server endpoint', false);
    return;
  }
  
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
      title: 'Interactive Demo Website',
      type: 'demo-page',
      mainElements: [
        { selector: '#main-title', type: 'heading', description: 'Main page title' },
        { selector: '#description', type: 'text', description: 'Page description paragraph' },
        { selector: '.demo-section', type: 'container', description: 'Demo section with examples' },
        { selector: '#section-title', type: 'heading', description: 'Section title' },
        { selector: '#demo-text', type: 'text', description: 'Demo text paragraph' },
        { selector: '#highlight-text', type: 'text', description: 'Highlighted text span' },
        { selector: '#dynamic-content', type: 'container', description: 'Dynamic content area' },
        { selector: '#demo-list', type: 'container', description: 'Demo list container' },
        { selector: '#footer', type: 'container', description: 'Footer section' }
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
