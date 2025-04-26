console.log("popup.js");

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        // Display the URL in the popup
        document.getElementById("url-content").innerText = activeTab.url;

        // Display temp.txt content in the popup
        fetch(chrome.runtime.getURL("temp.txt"))
            .then(response => response.text())
            .then(text => {
                document.getElementById("txt-content").innerText = text;
            });
        
    });
});