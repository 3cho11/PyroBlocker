// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline, env } from '@xenova/transformers';

// Enable the loading of local models from the filesystem
env.allowLocalModels = true;
// Disable the loading of remote models from the Hugging Face Hub
env.allowRemoteModels = false;
// Set the local model path to the onnx-model directory
env.localModelPath = chrome.runtime.getURL(''); // Explicit local model path
console.log('env.localModelPath', env.localModelPath);
// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;

if (navigator.gpu) {
    console.log("WebGPU is supported on this browser.");
} else {
    console.log("WebGPU is not supported on this browser.");
}



//////////////////////////////////////////////////////////////

//////////////////////// 1. Model Setup //////////////////////
// 
class PipelineSingleton {
    static task = 'text-classification';
    static model = 'onnx-model'; // Explicit model path
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

    // content.js may ask for current active tab
    if (message.action === 'getActiveTab') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                sendResponse(tabs[0]);
            } else {
                sendResponse(null);
            }
        });
        return true; // Required to allow asynchronous `sendResponse`
    }

    // content.js may ask for text classification
    if (message.action === 'classify') {
        // Run model prediction asynchronously
        (async function () {
            // Perform classification
            let result = await classify(message.text);

            // Send response back to content.js
            sendResponse(result);
        })();
        return true; // Required to allow asynchronous `sendResponse`
    }
    return; // Ignore other messages
});