import * as ort from './libs/ort.all.min.mjs';

ort.env.wasm.wasmPaths = chrome.runtime.getURL('./');


async function loadWasmModule() {
    try {
        const response = await fetch(chrome.runtime.getURL('libs/onnxruntime/wasm/ort-wasm-simd-threaded.jsep.wasm'));
        const buffer = await response.arrayBuffer();

        // Use instantiate instead of compile
        const { instance } = await WebAssembly.instantiate(buffer);
        return instance;
    } catch (error) {
        console.error("Error loading WASM module:", error);
    }
}



export async function initSession() {
    try {
        // Load the WASM module
        const wasmInstance = await loadWasmModule();

        // Set the WASM paths for ONNX Runtime
        ort.env.wasm.wasmPaths = chrome.runtime.getURL('libs/onnxruntime/wasm/');

        // Initialize ONNX Runtime with the WASM instance
        await ort.env.wasm.init(wasmInstance);

        // Load your ONNX model
        const session = await ort.InferenceSession.create('model1/model.onnx');
        console.log("ONNX model loaded successfully.");
        return session;
    } catch (error) {
        console.error("Error initializing ONNX session:", error);
    }
}




export async function analyseText() {

    // // Ensure 'ort' is defined
    // if (typeof ort === 'undefined') {
    //     console.error("ONNX Runtime library not loaded");
    //     return;
    // }
    // // Load your model
    // try {
    //     const session = await ort.InferenceSession.create('model1/model.onnx', {
    //         executionProviders: ['wasm']
    //     });
    //     console.log("Model loaded successfully!");
    // } catch (error) {
    //     console.error("Error loading model:", error);
    // }

};
// // Prepare input
// const inputTensor = new ort.Tensor('float32', [/* Your input data */], [/* Your input shape */]);

// // Run inference
// const output = await session.run({ input_name: inputTensor });

// // Process output
// console.log(output);
console.log("Great success!")
