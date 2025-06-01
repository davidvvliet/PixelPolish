(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function a(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerPolicy&&(n.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?n.credentials="include":o.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(o){if(o.ep)return;o.ep=!0;const n=a(o);fetch(o.href,n)}})();const d="/assets/pixelpolish-logo-C5QU-EKk.webp";document.querySelector("#app").innerHTML=`
  <div>
    <div class="header">
      <img src="${d}" class="logo pixelpolish" alt="PixelPolish logo" />
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
          src="https://example.com" 
          width="900" 
          height="700" 
          frameborder="0"
          title="Example.com">
        </iframe>
      </div>
    </div>
  </div>
`;let c;window.addEventListener("load",()=>{c=document.getElementById("targetIframe"),window.addEventListener("message",t=>{t.data.type==="DOM_MANIPULATION_RESULT"&&l(t.data.message,t.data.success)})});function i(t){c&&c.contentWindow?c.contentWindow.postMessage({type:"DOM_MANIPULATION",...t},"*"):l("Error: Iframe not loaded",!1)}function l(t,e=!0){const a=document.getElementById("status");a.textContent=t,a.className=e?"status-area success":"status-area error",setTimeout(()=>{a.textContent="Ready to manipulate DOM...",a.className="status-area"},3e3)}window.changeTitle=function(){i({action:"changeText",selector:"#main-title",content:"Modified Example Domain!"})};window.changeBackground=function(){i({action:"changeStyle",selector:"body",property:"backgroundColor",value:"#"+Math.floor(Math.random()*16777215).toString(16)})};window.addContent=function(){const t=["<p><strong>New content added!</strong> This was dynamically inserted.</p>",'<div style="padding: 10px; background: #e3f2fd; border-radius: 4px;">📦 Dynamic content block</div>',"<ul><li>Dynamically added item 1</li><li>Dynamically added item 2</li></ul>"];i({action:"changeHTML",selector:"#dynamic-content",content:t[Math.floor(Math.random()*t.length)]})};window.highlightText=function(){i({action:"changeStyle",selector:"#highlight-text",property:"backgroundColor",value:"#ff4444"})};window.hideSection=function(){i({action:"hide",selector:".demo-section"})};window.showSection=function(){i({action:"show",selector:".demo-section"})};window.changeElementText=function(){const t=document.getElementById("textSelector").value,e=document.getElementById("newText").value;if(!e.trim()){l("Please enter text to change",!1);return}i({action:"changeText",selector:t,content:e})};window.changeElementStyle=function(){const t=document.getElementById("styleSelector").value,e=document.getElementById("cssProperty").value,a=document.getElementById("cssValue").value;if(!t.trim()||!a.trim()){l("Please fill in all style fields",!1);return}i({action:"changeStyle",selector:t,property:e,value:a})};window.updateContent=function(){const t=document.getElementById("contentTarget").value,e=document.getElementById("htmlContent").value;if(!e.trim()){l("Please enter HTML content",!1);return}i({action:"changeHTML",selector:t,content:e})};window.addClass=function(){const t=document.getElementById("cssClass").value,e=document.getElementById("classTarget").value;if(!t.trim()||!e.trim()){l("Please enter both class name and target selector",!1);return}i({action:"addClass",selector:e,value:t})};window.removeClass=function(){const t=document.getElementById("cssClass").value,e=document.getElementById("classTarget").value;if(!t.trim()||!e.trim()){l("Please enter both class name and target selector",!1);return}i({action:"removeClass",selector:e,value:t})};
