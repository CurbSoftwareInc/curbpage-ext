chrome.action.onClicked.addListener((tab) => {
  // Check if the URL starts with 'chrome://'
  if (!tab.url || tab.url.startsWith('chrome://')) {
    console.log("Cannot inject script into a chrome:// URL");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['inject.js']
  });
});
