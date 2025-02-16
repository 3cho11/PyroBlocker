// background.js - Handles requests from the UI, runs the model, then sends back a response
console.log("background.js");

// import for classify
import { ClassificationPipeline } from "./classificationPipeline.js";

const pipeline = new ClassificationPipeline();

const blockPage = async () => {
    location.replace("https://www.google.com");
}

/**
 * Process data and decide if to block the page
 */
const decideIfToBlockPage = async (pageData) => {
    try {
        // pre-processing already done in content.js

        // Send the text to offscreen.js for classification
        // output is same .json format as pageData but the sentence is replaced with (label, score) pairs
        const raw_scores = await pipeline.classify(pageData);   x
        console.log("raw_scores in background.js:",raw_scores);

        // post-processing
        
        // apply power mean to all arrays
        const power_mean_scores = pipeline.powerMeanAllArrays(raw_scores);

        // logistic regression to get singular value
        // output is (label, score)
        const regression_score = pipeline.logisticRegression(power_mean_scores);
        console.log("regression_score:",regression_score);

        // final decision
        const final_prediction = regression_score > 0 ? "ADULT" : "SAFE";
        // 
        console.log("Final prediction:",final_prediction);


    } catch (error) {
        console.error("Error during classification:", error);
        latestMessage = "Error: Classification failed"; // Save error to latestMessage
    }
}


//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
// 
// Listen for messages from content.js, process it, and send the result back.
chrome.runtime.onMessage.addListener( async (message, sender, sendResponse) => {

    if (message.target === 'background' && message.action === 'classify') {
        decideIfToBlockPage(message.pageData);
    }

    return; // Ignore other messages
});