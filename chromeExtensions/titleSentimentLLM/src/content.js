// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.

const getSentiment = async (text) => {
    const message = {
        action: 'classify',
        text: text,
    };

    // Wrap chrome.runtime.sendMessage in a Promise so we can await it
    const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });

    // Format the response as a JSON string with indentation
    return JSON.stringify(response, null, 2);
};

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0]; // Get the active tab in the current window

    // display title
    const title = activeTab.title;
    document.getElementById('title').innerText = title;
    // Wait for the sentiment analysis result before displaying it
    try {
        const sentiment = await getSentiment(title);
        document.getElementById('sentiment').innerText = sentiment;
    } catch (error) {
        console.error("Error classifying sentiment:", error);
    }
});