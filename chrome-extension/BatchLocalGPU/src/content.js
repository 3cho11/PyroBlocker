console.log("content.js");

/**
 * Send a message to the background script to classify the sentiment of the given text
 * @param {*} text the text to classify
 */
const classify = async (text) => {
    const message = {
        target: 'background',
        action: 'classify',
        output: 'log',
        text: text,
    };

    chrome.runtime.sendMessage(message);
};

const title = document.title;
console.log("title:", title);

await classify(title);