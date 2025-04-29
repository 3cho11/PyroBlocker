// offscreen.js
console.log("offscreen.js");

import { pipeline, env, AutoModel, Tensor, mean_pooling } from '@xenova/transformers';

//import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/esm/ort.webgpu.min.js";
import * as ort from 'onnxruntime-web/webgpu';
// //must set wasm path override
// ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";


/*__________ Utility functions__________*/

/**
 * Helper function to convert batches into tensors.
 * @param {Array} batches - The input data to be converted into tensors.
 * @returns {Object} An object containing the tensors for the model inputs.
 */
const convertArraysToTensor = (batches) => {
    const tensors = {};

    batches.forEach(batch => {
        // Handle input_ids conversion
        if (batch.input_ids) {
            // Convert each number in the array to BigInt
            const input_ids_bigint = batch.input_ids.map(id => BigInt(id));

            // Create tensor using BigInt64Array
            tensors.input_ids = new ort.Tensor(
                'int64',
                new BigInt64Array(input_ids_bigint),
                [1, batch.input_ids.length]  // Adjust the dims if necessary
            );
        }

        // Handle attention_mask conversion
        if (batch.attention_mask) {
            // Convert each number in the array to BigInt
            const attention_mask_bigint = batch.attention_mask.map(mask => BigInt(mask));

            // Create tensor using BigInt64Array
            tensors.attention_mask = new ort.Tensor(
                'int64',
                new BigInt64Array(attention_mask_bigint),
                [1, batch.attention_mask.length]  // Adjust the dims if necessary
            );
        }
    });

    return tensors;
};



const getFile = async (filename) => {

    /**
     * Joins multiple parts of a path into a single path, while handling leading and trailing slashes.
     *
     * @param {...string} parts Multiple parts of a path.
     * @returns {string} A string representing the joined path.
     */
    function pathJoin(...parts) {
        // https://stackoverflow.com/a/55142565
        parts = parts.map((part, index) => {
            if (index) {
                part = part.replace(new RegExp('^/'), '');
            }
            if (index !== parts.length - 1) {
                part = part.replace(new RegExp('/$'), '');
            }
            return part;
        })
        return parts.join('/');
    }

    return fetch(pathJoin(env.localModelPath, filename));
};


/**
 * Compute softmax of logits
 *
 * @param {float[]} logits to be converted to probabilities
 * @returns {float[]} probabilities
 */
function softmax(logits) {
    const expValues = logits.map(Math.exp); // Apply exponent to each logit
    const sumExp = expValues.reduce((sum, val) => sum + val, 0); // Sum of all exponentials
    return expValues.map(val => val / sumExp); // Normalize
}


class PipelineSingleton {
    static task = 'text-classification';
    static quantized = false;
    static instance = null;
    static model_buffer = null;
    static tokenizer = null;

    static {//ES2022
        // env.allowLocalModels = false;    //this is a must and if it's true by default for the first time, wrong data is cached to keep failing after this line is added, until the cache is cleared in browser!
        env.allowLocalModels = true;
        env.allowRemoteModels = false;
        env.localModelPath = chrome.runtime.getURL('onnx'); // Explicit local model path

        // Due to a bug in onnxruntime-web, we must disable multithreading for now.
        // See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
        env.backends.onnx.wasm.numThreads = 1;
        ort.env.wasm.numThreads = 1;
    }

    static async getModelBuffer() {
        let modelONNX;
        // if quantized
        if (this.quantized) {
            modelONNX = await getFile('model_quantized.onnx');
        } else {
            modelONNX = await getFile('model.onnx');
        }

        // Convert the response to an ArrayBuffer.
        const modelBuffer = await modelONNX.arrayBuffer();

        console.log("Model buffer loaded:", modelBuffer);
        return modelBuffer;
    }

    static async getInstance(progress_callback = null) {
        if (!this.session) {
            /**
             * Normally we'd use the pipeline function:
             * 
             * this.instance = pipeline(this.task, this.model_name_or_path, { 
             *   quantized: this.quantized, 
             *   progress_callback,
             *   localFilesOnly: true,
             *   // more options: https://huggingface.co/docs/transformers.js/api/utils/hub#module_utils/hub..PretrainedOptions
             * });
             * 
             * However, to use WebGPU we will create a custom inference session
             */


            // get model weights
            const model_weights = await this.getModelBuffer();

            const hasWebGPU = ort.env.webgpu?.enabled === true;

            const options = hasWebGPU ? {
                executionProviders: [{
                    name: "webgpu",
                    preferredLayout: "NHWC"
                }],
                enableProfiling: false,
                enableMemPattern: false,
                enableCpuMemArena: false,
                extra: {
                    session: {
                        disable_prepacking: "1",
                        use_device_allocator_for_initializers: "1",
                        use_ort_model_bytes_directly: "1",
                        use_ort_model_bytes_for_initializers: "1",
                        disable_cpu_ep_fallback: "0",
                    }
                }
            } : {
                executionProviders: ["wasm"], // fallback to CPU WebAssembly
                enableProfiling: false,
                enableMemPattern: false,
                enableCpuMemArena: true, // better for CPU
            };

            console.log(`Creating session using ${hasWebGPU ? "WebGPU" : "CPU (WASM)"}`);
            this.session = await ort.InferenceSession.create(model_weights, options);
            console.log("session created:", this.session);
        }
        return this.session;
    }
}


//adapted from models.js
/**
 * Validate model inputs
 * @param {InferenceSession} session The InferenceSession object that will be run.
 * @param {Record<string, Tensor>} inputs The inputs to check.
 * @returns {Record<string, Tensor>} The checked inputs.
 * @throws {Error} If any inputs are missing.
 * @private
 */
function validateInputs(session, inputs) {
    /**
     * NOTE: Create either a shallow or deep copy based on `onnx.wasm.proxy`
     * @type {Record<string, Tensor>}
     */
    const missingInputs = [];
    for (const inputName of session.inputNames) {
        const tensor = inputs[inputName];
        // Rare case where one of the model's input names corresponds to a built-in
        // object name (e.g., toString), which would cause a simple (!tensor) check to fail,
        // because it's not undefined but a function.
        if (!(tensor instanceof ort.Tensor)) {
            missingInputs.push(inputName);
            continue;
        }
    }
    if (missingInputs.length > 0) {
        throw new Error(
            `An error occurred during model execution: "Missing the following inputs: ${missingInputs.join(', ')}.`);
    }

    const numInputsProvided = Object.keys(inputs).length;
    const numInputsNeeded = session.inputNames.length;
    if (numInputsProvided > numInputsNeeded) {
        // No missing inputs, but too many inputs were provided.
        // Warn the user and ignore the extra inputs.
        let ignored = Object.keys(inputs).filter(inputName => !session.inputNames.includes(inputName));
        console.warn(`WARNING: Too many inputs were provided (${numInputsProvided} > ${numInputsNeeded}). The following inputs will be ignored: "${ignored.join(', ')}".`);
    }

    return inputs;
}
/**
 * Executes an InferenceSession using the specified inputs.
 * NOTE: `inputs` must contain at least the input names of the model.
 *  - If additional inputs are passed, they will be ignored.
 *  - If inputs are missing, an error will be thrown.
 * 
 * @param {InferenceSession} session The InferenceSession object to run.
 * @param {Object} inputs An object that maps input names to input tensors.
 * @returns {Promise<Object>} A Promise that resolves to an object that maps output names to output tensors.
 * @private
 */
async function sessionRun(session, inputs) {
    const checkedInputs = validateInputs(session, inputs);
    try {
        // @ts-ignore
        let output = await session.run(checkedInputs);
        return output;
    } catch (e) {
        // This usually occurs when the inputs are of the wrong type.
        console.log(`An error occurred during model execution: "${e}".`);
        console.log('Inputs given to model:', checkedInputs);
        throw e;
    }
}

/**
 * Forward pass of an encoder model.
 * @param {Object} ONNX session.
 * @param {Object} model_inputs The input data to be used for the forward pass.
 * @returns {Promise<Object>} Promise that resolves with an object containing the model's outputs.
 * @private
 */
async function encoderForward(session, model_inputs) {
    const encoderFeeds = Object.create(null);
    for (const key of session.inputNames) {
        encoderFeeds[key] = model_inputs[key];
    }
    if (session.inputNames.includes('token_type_ids') && !encoderFeeds.token_type_ids) {
        // Assign default `token_type_ids` (all zeroes) to the `encoderFeeds` if the model expects it,
        // but they weren't created by the tokenizer.
        encoderFeeds.token_type_ids = new ort.Tensor(
            'int64',
            new BigInt64Array(encoderFeeds.input_ids.data.length),
            encoderFeeds.input_ids.dims
        )
    }
    return await sessionRun(session, encoderFeeds);
}


const classify = async (batches) => {

    // convert batches to tensors
    const model_inputs = convertArraysToTensor(batches);

    const session = await PipelineSingleton.getInstance();

    // start inference timer
    const start_time = performance.now();

    // this may return logits or a tensor still in need of mean pooling and normalization
    let encoder_outputs = await encoderForward(session, model_inputs);

    // end inference timer
    const end_time = performance.now();
    const inference_time = end_time - start_time;

    let result_tensor;
    // If our model returns logits directly
    if (encoder_outputs.logits) {
        result_tensor = encoder_outputs.logits;
    } else {
        result_tensor = encoder_outputs.last_hidden_state;
        // logits not detected, mean pooling + normalisation still needed
        // pooling === 'mean'
        result_tensor = mean_pooling(result_tensor, model_inputs.attention_mask);
        // normalize === true
        result_tensor = result_tensor.normalize(2, -1);
    }
    // we have .data and .dims
    const logits = result_tensor

    // use .dims to convert logits into an array of tuples grouping logits by sentence
    const logits_array = Array.from(logits.data);
    const logit_tuples = [];
    const [num_sentences, num_categories] = logits.dims;

    for (let i = 0; i < (num_sentences * num_categories); i += num_categories) {
        logit_tuples.push(logits_array.slice(i, i + num_categories));
    }
    console.log("logit_tuples:", logit_tuples);
    const probability_tuples = logit_tuples.map(softmax);
    console.log("probability_tuples:", probability_tuples);

    const label_indices_and_scores = probability_tuples.map(probabilities => {
        const maxProb = Math.max(...probabilities);
        const maxIndex = probabilities.indexOf(maxProb);
        return [maxIndex, probabilities[maxIndex]];
    });
    // instead of finding a label we'll make the score negative if index is 0
    const scores = label_indices_and_scores.map(([index, score]) => {
        return index === 0 ? -score : score;
    });
    console.log("scores:", scores);

    // returns array of scores
    return { scores, inference_time };

}

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "offscreen") {
        console.log("background-offscreen connection established");

        port.onMessage.addListener(async (message) => {
            if (message.action === "classify") {
                console.log("Classify request:", message.data);
                const data = await classify(message.data);
                // const raw_scores = "test";
                port.postMessage({ success: true, data });
            }
        });

        port.onDisconnect.addListener(() => {
            console.log("Disconnected from background.js");
        });
    }
});