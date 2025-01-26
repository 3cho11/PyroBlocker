// popup.js - handles interaction with the extension's popup, sends requests to the

const message = {
    action: 'getTitleAndSentiment',
};

chrome.runtime.sendMessage(message, (response) => {
    if (response) {
        console.log('sentiment at popup:', response.sentiment);
        document.getElementById('title').innerText = response.title || 'No title available';
        document.getElementById('label').innerText = response.sentiment.label || 'No label available';
        document.getElementById('score').innerText = response.sentiment.score || 'No score available';
    } else {
        // if there exists a previous response we can just show that one
        if (document.getElementById('title')==='') {
            document.getElementById('title').innerText = 'Error fetching title';
            document.getElementById('label').innerText = 'Error fetching label';
            document.getElementById('score').innerText = 'Error fetching score';
        }
    }
});