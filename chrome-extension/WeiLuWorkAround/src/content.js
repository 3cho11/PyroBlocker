console.log("content.js");

/**
 * Send a message to the background script to classify the sentiment of the given text
 * @param {*} text the text to classify
 * @returns {Promise} Promise that resolves to the sentiment analysis result
 */
const doTitleAnalysis = async (text) => {
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


const title = document.title;
console.log("title:", title);

const result = await doTitleAnalysis(title);
console.log("result:", result);