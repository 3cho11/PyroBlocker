// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline, env } from '@xenova/transformers';

// Enable the loading of local models from the filesystem
env.allowLocalModels = true;
// Disable the loading of remote models from the Hugging Face Hub:
env.allowRemoteModels = false;
// Set the path to the local model directory
env.localModelPath = chrome.runtime.getURL('onnx-model');

// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;

//////////////////////////////////////////////////////////////

//////////////////////// 1. Model Setup //////////////////////
// 
class PipelineSingleton {
    static task = 'text-classification';
    static model = chrome.runtime.getURL('onnx-model'); // Resolve local folder path
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, {
                progress_callback,
                localFilesOnly: true, // Ensures it doesn't try to download from Hugging Face
            });
        }

        return this.instance;
    }
}


// Create generic classify function, which will be reused for the different types of events.
const classify = async (text) => {
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('sender', sender)
    if (message.action !== 'classify') return; // Ignore messages that are not meant for classification.

    // Run model prediction asynchronously
    (async function () {
        // Perform classification
        let result = await classify(message.text);

        // Send response back to content.js
        sendResponse(result);
    })();

    // return true to indicate we will send a response asynchronously
    // see https://stackoverflow.com/a/46628145 for more information
    return true;
});