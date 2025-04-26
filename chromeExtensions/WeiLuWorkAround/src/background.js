// background.js - Handles requests from the UI, runs the model, then sends back a response
console.log("background.js");
import { pipeline, env } from '@xenova/transformers';

async function createOffscreen() {
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

class PipelineSingleton {
    static task = 'text-classification';//'text-classification';
    static model_name_or_path = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';//'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

    static quantized = false;
    static instance = null;
    static model_buffer = null;
    static tokenizer = null;

    static {//ES2022
        env.allowLocalModels = false;    //this is a must and if it's true by default for the first time, wrong data is cached to keep failing after this line is added, until the cache is cleared in browser!
        // Due to a bug in onnxruntime-web, we must disable multithreading for now.
        // See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
        env.backends.onnx.wasm.numThreads = 1;
    };

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model_name_or_path, { quantized: this.quantized, progress_callback /*more options: https://huggingface.co/docs/transformers.js/api/utils/hub#module_utils/hub..PretrainedOptions*/ });
        }

        return this.instance;
    };
}

// Create generic classify function, which will be reused for the different types of events.
const classify = async (text) => {
    try {
        await createOffscreen();
        const message = {
            action: "classify",
            text: text,
        };

        // Wrap chrome.runtime.sendMessage in a Promise so we can await it
        return new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: "offscreen" });

            port.onMessage.addListener((response) => {
                if (response.success) {
                    resolve(response.result);
                } else {
                    reject(new Error(response.error));
                }
                port.disconnect(); // Close the port after response
            });

            port.onDisconnect.addListener(() => {
                console.log("Port disconnected");
            });

            port.postMessage(message);
        });
    } catch (error) {
        // Log the error with additional debugging information
        if (error instanceof Error) {
            console.error("Error in classify function:", error.message);
        } else if (typeof error === "object") {
            console.error("Error in classify function:", JSON.stringify(error, null, 2));
        } else {
            console.error("Error in classify function:", String(error));
        }

        throw error; // Optionally rethrow to propagate it further
    }
};



//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
// 
// Listen for messages from content.js, process it, and send the result back.
let latestMessage = null;
chrome.runtime.onMessage.addListener( async (message, sender, sendResponse) => {
    
    // offscreen.js may ask to log some information
    if (message.action === 'log') {
        console.log("from offscreen", message.data);
    }

    // content.js may ask for text classification
    if (message.action === 'classify') {
        try {
            // Send the text to offscreen.js for classification
            const result = await classify(message.text); // Assume classify is an async function
            console.log("Classification finished in offscreen.js:",result);

            latestMessage = {
                title: message.text,
                sentiment: result
            }
        } catch (error) {
            console.error("Error during classification:", error);
            latestMessage = "Error: Classification failed"; // Save error to latestMessage
        }
    }

    // popup is opened and popup.js asks for title and sentiment
    else if (message.action === 'getTitleAndSentiment') {
        console.log("fetching latest message:", latestMessage);
        sendResponse(latestMessage);
        return true // Required for async sendResponse
    }

    return; // Ignore other messages
});