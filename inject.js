// This script will be injected into the current page
(function() {
    // Check if our modal is already present
    if (document.getElementById('curb-page-modal')) return;

    // Create a new div element for our modal
    const modal = document.createElement('div');
    modal.id = 'curb-page-modal';
    modal.innerHTML = `
        <div class="extension-container">
            <h1 class="extension-title">
                <img src="${chrome.runtime.getURL('icons/icon16.png')}" alt="Extension Icon">&nbsp;Curb Page Navigator
            </h1>
            <p class="curbsoftware">Developed by <a href="https://curbsoftware.com" target="_blank">CurbSoftware</a></p>
            <div class="input-wrapper">
                <input type="text" id="newUrlInput" placeholder="Enter a Relative URL - starts with /">
                <button id="saveButton" class="button">Save</button>
            </div>
            <div id="urlList" class="url-list">
                <!-- URL entries will be added here -->
            </div>
            <button id="wp-button" class="button wp-button">Admin Bar Toggle</button>
        </div>`;
    document.body.appendChild(modal);

    // Append the styles for the modal
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = chrome.runtime.getURL('styles.css');
    document.head.appendChild(style);

    // Load your popup.js script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('popup.js');
    document.head.appendChild(script);
})();
