console.log("content.js");

/**
 * Send a message to the background script to classify the sentiment of the given text
 * @param {*} text the text to classify
 * @returns {Promise} Promise that resolves to the sentiment analysis result
 */
const getSentiment = async (text) => {
    const message = {
        target: 'background',
        action: 'classify',
        output: 'log',
        text: text,
    };

    // Wrap chrome.runtime.sendMessage in a Promise so we can await it
    const response = new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });

    // Format the response as a JSON string with indentation
    return response;
};

/**
 * 
 * @param {*} title title to display
 * @param {*} sentiment sentiment to display
 * @returns true if the message was sent successfully, false otherwise
 */
const displayResults = async (title, sentiment) => {
    console.log("sending message to background");
    const message = {
        action: 'updatePopup',
        title: title,
        sentiment: sentiment,
    };
    chrome.runtime.sendMessage(message)
};

const title = document.title;
console.log("title:", title);
const sentiment = await getSentiment(title);
console.log("sentiment:", sentiment);
displayResults(title, sentiment);