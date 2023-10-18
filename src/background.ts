chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    chrome.tabs.executeScript(tabId, {
      code: 'console.log("Hello, World!");'
    });
  }
});
