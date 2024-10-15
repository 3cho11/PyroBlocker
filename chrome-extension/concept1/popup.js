console.log("popup.js");

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        // Display the URL in the popup
        document.getElementById("url-content").innerText = activeTab.url;

        // Display the HTML content in the popup
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => document.documentElement.outerHTML
        }, (results) => {
            if (results && results[0] && results[0].result) {
                document.getElementById("html-content").innerText = results[0].result;
            }
        });
    });
});