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

document.addEventListener('DOMContentLoaded', async () => {
    // Request active tab info from the background script
    const activeTab = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getActiveTab' }, (activeTab) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(activeTab);
            }
        });
    });

    const displayTitleSentiment = async (activeTab) => {
        // Display title
        const title = activeTab.title;
        console.log("Title:", title);
        console.log(typeof document);
        console.log("titleElement", typeof document.getElementById('title'));
        console.log("titleElementText", typeof document.getElementById('title').innerText);
        document.getElementById('title').innerText = title;

        // Wait for the sentiment analysis result before displaying it
        try {
            const sentiment = await getSentiment(title);
            document.getElementById('sentiment').innerText = sentiment;
        } catch (error) {
            console.error("Error classifying sentiment:", error);
        }
    };

    // Call displayTitleSentiment with the active tab
    displayTitleSentiment(activeTab);
});