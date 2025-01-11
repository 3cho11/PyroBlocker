// popup.js - handles interaction with the extension's popup, sends requests to the

const message = {
    action: 'getTitleAndSentiment',
};

chrome.runtime.sendMessage(message, (response) => {
    if (response) {
        console.log('sentiment at popup:', response.sentiment);
        document.getElementById('title').innerText = response.title || 'No title available';
        document.getElementById('label').innerText = response.sentiment[0].label || 'No label available';
        document.getElementById('score').innerText = response.sentiment[0].score || 'No score available';
    } else {
        console.error("No response received from background script.");
        document.getElementById('title').innerText = 'Error fetching title';
        document.getElementById('label').innerText = 'Error fetching label';
        document.getElementById('score').innerText = 'Error fetching score';

    }
});


