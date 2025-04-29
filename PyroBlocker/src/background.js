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

/**
 * Classifies the given data using an offscreen document and a classification pipeline.
 * Ensures that an offscreen document is created before performing the classification.
 *
 * @async
 * @function classify
 * @param {Object} data - The data to be classified.
 * @returns {Promise<Object>} - A promise that resolves to the classification result.
 * @throws {Error} - Throws an error if the classification process fails.
 */
const classify = async (data) => {
    await createOffscreen();
    const pipeline = new ClassificationPipeline();
    return pipeline.classifyInOffscreen(data);
}


chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "background") {
        port.onMessage.addListener(async (message) => {
            if (message.action === "getTokenizer") {
                console.log("Attempting to retrieve tokenizer files");
                let specialTokensMap = null; // Initialize specialTokensMap to null

                try {
                    console.log("Fetching from", chrome.runtime.getURL('onnx/tokenizer.json'));
                    const tokenizer = await (await fetch(chrome.runtime.getURL('onnx/tokenizer.json'))).json();
                    console.log("Fetching from", chrome.runtime.getURL('onnx/tokenizer_config.json'));
                    const tokenizerConfig = await (await fetch(chrome.runtime.getURL('onnx/tokenizer_config.json'))).json();
                    // Optionally, if you need special_tokens_map.json:
                    console.log("Fetching from", chrome.runtime.getURL('onnx/special_tokens_map.json'));
                    try {
                        specialTokensMap = await (await fetch(chrome.runtime.getURL('onnx/special_tokens_map.json'))).json();
                    } catch (e) {
                        console.warn("Optional special_tokens_map.json failed to load:", e);
                    }

                    port.postMessage({
                        success: true,
                        data: {
                            tokenizer,
                            tokenizerConfig,
                            specialTokensMap
                        }
                    });
                } catch (error) {
                    console.error("Error fetching tokenizer files:", error);
                    port.postMessage({ success: false, error: error.message });
                }
            }

            else if (message.action === "classify") {
                console.log("Classify request via port w/ data:", message.data);
                try {
                    const raw_scores = await classify(message.data);
                    console.log("raw_scores in background:", raw_scores);
                    port.postMessage({ success: true, data: raw_scores });
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