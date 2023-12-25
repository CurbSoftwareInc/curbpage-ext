// popup.js
let editingUrl = null;

// Setup event listeners immediately
setupEventListeners();
loadUrls();

function setupEventListeners() {
    const saveButton = document.getElementById('saveButton');
    const newUrlInput = document.getElementById('newUrlInput');
    const wpButton = document.getElementById('wp-button');

    saveButton?.addEventListener('click', handleAddEditUrl);
    newUrlInput?.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            handleAddEditUrl();
        }
    });
    wpButton?.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: toggleWpAdminBar
            });
        });
    });
}

function loadUrls() {
    chrome.storage.sync.get(['urls'], function(result) {
        if (result.urls) {
            result.urls.forEach(url => addUrlToGrid(url));
        }
    });
}

function handleAddEditUrl() {
    var newUrl = document.getElementById('newUrlInput').value;
    if (!newUrl) {
        alert("Please enter a URL.");
        return;
    }
    if (!newUrl.startsWith('/')) {
        alert("URL must start with '/'.");
        return;
    }
    if (editingUrl !== null) {
        updateUrlInGrid(editingUrl, newUrl);
    } else {
        addUrlToGrid(newUrl);
    }
    saveUrls();
    document.getElementById('newUrlInput').value = '';
    editingUrl = null;
}

function addUrlToGrid(url) {
    var list = document.getElementById('urlList');

    // Create a new div for the row
    var rowDiv = document.createElement('div');
    rowDiv.className = 'grid-row';

    // Navigate button
    var navigateButton = createGridButton('Go', 'navigateButton', function() {
        navigateToRelativeUrl(url);
    });
    rowDiv.appendChild(navigateButton);

    // URL text
    var urlDiv = document.createElement('div');
    urlDiv.textContent = url;
    urlDiv.className = 'urlEntry';
    rowDiv.appendChild(urlDiv);

    // Edit button
    var editButton = createGridButton('Edit', 'editButton', function() {
        editUrl(url, urlDiv);
    });
    rowDiv.appendChild(editButton);

    // Delete button
    var deleteButton = createGridButton('Delete', 'deleteButton', function() {
        deleteUrlFromGrid(rowDiv);
    });
    rowDiv.appendChild(deleteButton);

    // Append the row to the list
    list.appendChild(rowDiv);
}

function createGridButton(text, className, onClick) {
    var button = document.createElement('button');
    button.textContent = text;
    button.classList.add(className, 'button');
    button.addEventListener('click', onClick);
    return button;
}

function editUrl(url, urlDiv) {
    var navigateButton = urlDiv.parentNode.querySelector('.navigateButton');
    document.getElementById('newUrlInput').value = url;
    editingUrl = { url, element: urlDiv, navigateButton };
}


function deleteUrlFromGrid(rowDiv) {
    rowDiv.remove();
    saveUrls();
}

function updateUrlInGrid(oldUrl, newUrl) {
    if (editingUrl && editingUrl.element) {
        editingUrl.element.textContent = newUrl;
        editingUrl.navigateButton.removeEventListener('click', navigateToRelativeUrl);
        editingUrl.navigateButton.addEventListener('click', function() {
            navigateToRelativeUrl(newUrl);
        });
    }
    saveUrls();
}

function navigateToRelativeUrl(url) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var currentTab = tabs[0];
        var newUrl = new URL(currentTab.url);
        newUrl.pathname = url;
        chrome.tabs.update(currentTab.id, {url: newUrl.href});
    });
}

function saveUrls() {
    const urls = Array.from(document.querySelectorAll('.urlEntry')).map(entry => entry.textContent);
    chrome.storage.sync.set({ urls }, function() {
        console.log('URLs are saved');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('wp-button').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: toggleWpAdminBar
            });
        });
    });
});

function toggleWpAdminBar() {
    var wpAdminBar = document.getElementById('wpadminbar');
    var body = document.body;

    // Check and set initial inline style if not present
    if (wpAdminBar && wpAdminBar.style.transform === '') {
        wpAdminBar.style.transform = 'translateY(0px)';
        body.style.marginTop = '0px';
    }

    if (wpAdminBar) {
        wpAdminBar.style.transition = 'transform 0.3s ease-in-out';
        body.style.transition = 'margin-top 0.3s ease-in-out';
        if (wpAdminBar.style.transform === 'translateY(0px)') {
            // Move the admin bar up and adjust body margin
            wpAdminBar.style.transform = 'translateY(-32px)';
            body.style.marginTop = '-32px';
        } else {
            // Move the admin bar down and reset body margin
            wpAdminBar.style.transform = 'translateY(0px)';
            body.style.marginTop = '0px';
        }
    }
}

