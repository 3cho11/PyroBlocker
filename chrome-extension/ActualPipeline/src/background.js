// background.js - Handles requests from the UI, runs the model, then sends back a response
console.log("background.js");

import { ClassificationPipeline } from "./classificationPipeline.js";


const createOffscreen = async () => {
    if (await chrome.offscreen.hasDocument()) return;
    await chrome.offscreen.createDocument({
        url: "offscreen.html",

        /* valid reasons: 
        AUDIO_PLAYBACK, 
        BLOBS, 
        CLIPBOARD, 
        DISPLAY_MEDIA, 
        DOM_PARSER, 
        DOM_SCRAPING, 
        IFRAME_SCRIPTING,
        TESTING, 
        USER_MEDIA, 
        WEB_RTC.
        */
        reasons: ["BLOBS"],
        justification: "testing",
    });
}

const classify = async (pageData) => {
    await createOffscreen();
    const pipeline = new ClassificationPipeline();
    return pipeline.classifyInOffscreen(pageData);
}
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
//
// chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
//     if (message.target === "background" && message.action === "classify") {
//         console.log("Classify request:", message.pageData);
//         try {
//             await createOffscreen();
//             const pipeline = new ClassificationPipeline();
//             const raw_scores = await pipeline.classifyInOffscreen(message.pageData);
//             console.log("raw_scores in background:", raw_scores);
//             sendResponse({ success: true, result: raw_scores });
//         } catch (error) {
//             console.error("Error during classification:", error);
//             sendResponse({ success: false, error: error.message });
//         }
//         return true; // Indicates that the response will be sent asynchronously
//     }
//     return;
// });


chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "background") {

        port.onMessage.addListener(async (message) => {
            if (message.action === "classify") {
                console.log("Classify request via port:", message.pageData);
                try {
                    const raw_scores = await classify(message.pageData);
                    console.log("raw_scores in background:", raw_scores);
                    port.postMessage({ success: true, result: raw_scores });
                } catch (error) {
                    console.error("Error during classification:", error);
                    port.postMessage({ success: false, error: error.message });
                }
            }
        });

        port.onDisconnect.addListener(() => {
            console.log("Disconnected from background.js");
        });
    }
});