import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'

document.querySelector('#app').innerHTML = `
  <div>
    <div class="header">
      <a href="https://vite.dev" target="_blank">
        <img src="${viteLogo}" class="logo" alt="Vite logo" />
      </a>
      <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
        <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
      </a>
      <h1>DOM Manipulation Portal</h1>
    </div>

    <div class="main-content">
      <div class="control-panel">
        <h2>🎛️ Control Panel</h2>
        
        <!-- Quick Actions -->
        <div class="control-section">
          <h3>Quick Actions</h3>
          <div class="quick-actions">
            <button class="action-btn" onclick="changeTitle()">Change Title</button>
            <button class="action-btn" onclick="changeBackground()">Change Background</button>
            <button class="action-btn" onclick="addContent()">Add Content</button>
            <button class="action-btn" onclick="highlightText()">Highlight Text</button>
            <button class="action-btn" onclick="hideSection()">Hide Section</button>
            <button class="action-btn" onclick="showSection()">Show Section</button>
          </div>
        </div>

        <!-- Text Manipulation -->
        <div class="control-section">
          <h3>Text Manipulation</h3>
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

        <!-- Style Manipulation -->
        <div class="control-section">
          <h3>Style Manipulation</h3>
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

        <!-- Content Manipulation -->
        <div class="control-section">
          <h3>Content Manipulation</h3>
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

        <!-- Advanced Controls -->
        <div class="control-section">
          <h3>Advanced Controls</h3>
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
          src="./example.html" 
          width="800" 
          height="600" 
          frameborder="0"
          title="Local Example Domain">
        </iframe>
      </div>
    </div>
  </div>
`

// DOM Manipulation Functions
let targetIframe;

// Wait for iframe to load
window.addEventListener('load', () => {
  targetIframe = document.getElementById('targetIframe');
  
  // Listen for messages from iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'DOM_MANIPULATION_RESULT') {
      updateStatus(event.data.message, event.data.success);
    }
  });
});

function sendMessageToIframe(data) {
  if (targetIframe && targetIframe.contentWindow) {
    targetIframe.contentWindow.postMessage({
      type: 'DOM_MANIPULATION',
      ...data
    }, '*');
  } else {
    updateStatus('Error: Iframe not loaded', false);
  }
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
  sendMessageToIframe({
    action: 'hide',
    selector: '.demo-section'
  });
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
