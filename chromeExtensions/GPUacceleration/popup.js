console.log("popup.js");
import { initSession, analyseText } from './language-model.js'

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        // Display the URL in the popup
        document.getElementById("url-content").innerText = activeTab.url;

        // Display the HTML content in the popup
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => document.title
        }, (results) => {
            if (results && results[0] && results[0].result) {
                document.getElementById("title-content").innerText = results[0].result;
            }
        });
    });
});
initSession();
analyseText();
// async function handleTextAnalysis() {
//     const result = await analyseText('I love transformers!');
//     document.getElementById('sentiment').innerText = result;  // Displays the result in the popup
// }

// // Call the function when needed, e.g., on a button click
// document.getElementById('analyseButton').addEventListener('click', handleTextAnalysis);
