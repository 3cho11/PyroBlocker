// offscreen.js
const log = async (...args) => {
    const message = {
        target: 'background',
        action: 'log',
        data: args.map(arg => {
            try {
                return JSON.stringify(arg, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value, // Handle BigInt
                    2
                );
            } catch (error) {
                return `Non-serializable data: ${error.message}`;
            }
        }),
    };
    chrome.runtime.sendMessage(message);
};
log('offscreen.js')

import { pipeline, env, PreTrainedTokenizer, AutoModel, Tensor, mean_pooling } from '@xenova/transformers';

//import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/esm/ort.webgpu.min.js";
import * as ort from 'onnxruntime-web/webgpu';
//must set wasm path override
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";


// adapted from configs.js
/**
 * myPreTrainedConfig
 * 
 * A lightweight configuration class that mimics key behavior of
 * a full PreTrainedConfig. It simply assigns properties from the
 * config JSON and normalizes values as needed.
 */
class MyPreTrainedConfig {
    constructor(configJSON) {
        // Copy all properties from the JSON.
        Object.assign(this, configJSON);
        
        // Perform normalization if needed.
        // For example, if max_position_embeddings is missing, default to 512.
        this.max_position_embeddings = this.max_position_embeddings || 512;
        
        // You can also ensure that id2label exists:
        if (!this.id2label) {
            console.warn("id2label mapping not found in config; please check your config.json.");
            this.id2label = {'0': 'LABEL_0', '1': 'LABEL_1'};
        }
        
        // Additional normalization logic can be added here.
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
    const checkedInputs = Object.create(null);
    const missingInputs = [];
    for (const inputName of session.inputNames) {
        const tensor = inputs[inputName];
        // Rare case where one of the model's input names corresponds to a built-in
        // object name (e.g., toString), which would cause a simple (!tensor) check to fail,
        // because it's not undefined but a function.
        if (!(tensor instanceof Tensor)) {
            missingInputs.push(inputName);
            continue;
        }
        // NOTE: When `env.wasm.proxy is true` the tensor is moved across the Worker
        // boundary, transferring ownership to the worker and invalidating the tensor.
        // So, in this case, we simply sacrifice a clone for it.
        //console.log(ort.env.wasm.proxy);//false on onnxruntime/webgpu 1.17.0
        //checkedInputs[inputName] = ort.env.wasm.proxy ? tensor.clone() : tensor;
        checkedInputs[inputName] = new ort.Tensor(tensor.type, tensor.data, tensor.dims);
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

    return checkedInputs;
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
        log(`An error occurred during model execution: "${e}".`);
        log('Inputs given to model:', checkedInputs);
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

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
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

            // get unconfigured tokenizer
            const tokenizer = await this.getTokenizer();

            // get config for model
            const config = await this.getConfig();

            // apply config to tokenizer
            tokenizer.config = config;

            // get model weights
            const model_weights = await this.getModelBuffer();

            // set options for inference session - see https://github.com/microsoft/onnxruntime/blob/main/include/onnxruntime/core/session/onnxruntime_session_options_config_keys.h
            const opt = {
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
                },
                //freeDimensionOverrides: { batch_size: 1, },   
            };

            // create inference session
            const session = await ort.InferenceSession.create(model_weights, opt);

            // set instance
            this.instance = {
                tokenizer,
                session
            };

        }
        return this.instance;
    }
    static async getTokenizer() {
        const tokenizerJSON = await (await getFile('tokenizer.json')).json();
        const tokenizerConfig = await (await getFile('tokenizer_config.json')).json();
        // Optionally, if you need special_tokens_map.json:
        const specialTokensMap = await (await getFile('special_tokens_map.json')).json();

        // If the constructor expects all necessary info in tokenizerJSON and tokenizerConfig,
        // you might merge in the special tokens map manually if required:
        if (specialTokensMap) {
        tokenizerJSON.added_tokens = specialTokensMap.added_tokens || tokenizerJSON.added_tokens;
        }

        // use in-built PreTrainedTokenizer class to format a correct tokenizer instance:
        const tokenizer = new PreTrainedTokenizer(tokenizerJSON, tokenizerConfig);

        // The instance should now be ready for tokenization/inference:
        console.log("Tokenizer loaded:", tokenizer);
        return tokenizer;
    }

    static async getConfig() {
        // fetch config.json
        const configJSON = await (await getFile('config.json')).json();

        // use in-built PreTrainedConfig class to format a correct config instance:
        const config = new MyPreTrainedConfig(configJSON);
        
        console.log("Config loaded:", config);
        return config;
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
}

const classify = async (msg) => {
    let sentences = [msg.text];
    // temporarily change sentences
    // sentences = ["graph theory", "porn", "a", "1", "safe", "adult"];
    
    const pipeline = await PipelineSingleton.getInstance();

    //adapted from pipeline.js FeatureExtractionPipeline._call(texts, {
    //     pooling = /** @type {'none'} */('none'),
    //     normalize = false,
    // } = {})
    console.log("sentences:",sentences);
    const model_inputs = await pipeline.tokenizer(sentences, {
        padding: "max_length",
        truncation: true,
        max_length: pipeline.tokenizer.config.max_position_embeddings,
    });

    // this may return logits or a tensor still in need of mean pooling and normalization
    let encoder_outputs = await encoderForward(pipeline.session, model_inputs);

    console.log("encoder_outputs logits:",encoder_outputs.logits);
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
    console.log("logit_tuples:",logit_tuples);

    const probability_tuples = logit_tuples.map(softmax);
    console.log("probability_tuples:",probability_tuples);

    const label_indices_and_scores = probability_tuples.map(probabilities => {
        const maxProb = Math.max(...probabilities);
        const maxIndex = probabilities.indexOf(maxProb);
        return [maxIndex, probabilities[maxIndex]];
    });

    const label_indices = label_indices_and_scores.map(tuple => tuple[0]);
    const scores = label_indices_and_scores.map(tuple => tuple[1]);

    const labels = label_indices.map(index => pipeline.tokenizer.config.id2label[index]);
    console.log("labels:",labels);

    const predictions = {
        label: labels,
        score: scores
    };

    return predictions;
}

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "offscreen") {
        console.log("Connected to background.js");

        port.onMessage.addListener( async (message) => {
            if (message.action === "classify") {
                console.log("Classify request:", message.text);
                const result = await classify(message);
                console.log("result in offscreen:",result);
                port.postMessage({ success: true, result });
            }
        });

        port.onDisconnect.addListener(() => {
            console.log("Disconnected from background.js");
        });
    }
});