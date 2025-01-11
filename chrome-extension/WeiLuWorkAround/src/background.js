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
    console.log("background classify");
    await createOffscreen();
    await chrome.runtime.sendMessage({
        target: "offscreen",
        text: text
    });

    // Get the pipeline instance. This will load and build the model when run for the first time.
    let model = await PipelineSingleton.getInstance((data) => {
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        // console.log('progress', data)
    });

    // Actually run the model on the input text
    let result = await model(text);
    return result;
};



//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
// 
// Listen for messages from content.js, process it, and send the result back.
let latestMessage = null;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('sender', sender)

    // content.js may ask for text classification
    if (message.target === 'background' && message.action === 'classify') {
        if (message.action === 'log') {
            console.log("from offscreen", message.data);
        }
        // Run model prediction asynchronously
        (async function () {
            // Perform classification
            let result = await classify(message.text);

            // Send response back to content.js
            sendResponse(result);
        })();
        return true; // Required to allow asynchronous `sendResponse`
    }

    else if (message.action === 'updatePopup') {
        // Update the latest message
        latestMessage = {
            title: message.title,
            sentiment: message.sentiment,
        };
    }

    else if (message.action === 'getTitleAndSentiment') {
        sendResponse(latestMessage);
        return true // Required for async sendResponse3
    }

    return; // Ignore other messages
});