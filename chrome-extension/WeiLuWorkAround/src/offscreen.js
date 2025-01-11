// offscreen.js 
import { pipeline, env, AutoTokenizer, AutoModel, Tensor, mean_pooling } from '@xenova/transformers';

//import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/esm/ort.webgpu.min.js";
import * as ort from 'onnxruntime-web/webgpu';
//must set wasm path override
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";

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


//adapted from utils/hub.js
/**
 * 
 * @param {FileCache|Cache} cache The cache to search
 * @param {string[]} names The names of the item to search for
 * @returns {Promise<FileResponse|Response|undefined>} The item from the cache, or undefined if not found.
 */
async function tryCache(cache, ...names) {
    for (let name of names) {
        try {
            let result = await cache.match(name);
            if (result) return result;
        } catch (e) {
            continue;
        }
    }
    return undefined;
}
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


class PipelineSingleton {
    static task = 'text-classification';
    static model_name_or_path = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    // static quantized = false;
    static instance = null;
    static model_buffer = null;
    static tokenizer = null;

    static {//ES2022
        env.allowLocalModels = false;    //this is a must and if it's true by default for the first time, wrong data is cached to keep failing after this line is added, until the cache is cleared in browser!
        // Due to a bug in onnxruntime-web, we must disable multithreading for now.
        // See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
        env.backends.onnx.wasm.numThreads = 1;
        ort.env.wasm.numThreads = 1;
    };

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model_name_or_path, { quantized: this.quantized, progress_callback /*more options: https://huggingface.co/docs/transformers.js/api/utils/hub#module_utils/hub..PretrainedOptions*/ });
        }

        return this.instance;
    };
    static async getTokenizer(progress_callback = null) {
        if (this.tokenizer === null) {
            this.tokenizer = await AutoTokenizer.from_pretrained(this.model_name_or_path, { quantized: this.quantized, progress_callback });
        }
        return this.tokenizer;
    };
    static async getModelBuffer(progress_callback = null) {
        if (this.model_buffer === null) {
            let model = await AutoModel.from_pretrained(this.model_name_or_path, { quantized: this.quantized, progress_callback });
            model.dispose();
            let cache = await caches.open('transformers-cache');
            let fileName = 'model';
            let modelFileName = `onnx/${fileName}${this.quantized ? '_quantized' : ''}.onnx`;
            const revision = 'main';

            let requestURL = pathJoin(this.model_name_or_path, modelFileName);
            let localPath = pathJoin(env.localModelPath, requestURL);

            let remoteURL = pathJoin(
                env.remoteHost,
                env.remotePathTemplate
                    .replaceAll('{model}', this.model_name_or_path)
                    .replaceAll('{revision}', encodeURIComponent(revision)),
                modelFileName
            );
            let proposedCacheKey = remoteURL;
            let response = await tryCache(cache, localPath, proposedCacheKey);
            if (response)
                this.model_buffer = new Uint8Array(await response.arrayBuffer());

        }
        return this.model_buffer;
    }
}

const log = async (...args) => {
    const message = {
        target: 'background',
        action: 'log',
        data: args,
    }
    chrome.runtime.sendMessage(message)
};

chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.target !== "offscreen") return;
    //log(msg);

    const sentences = [msg.text, 'I love walking my dog.'];
    const tokenizer = await PipelineSingleton.getTokenizer(x => {
        // We also add a progress callback to the pipeline so that we can
        // track model loading.
        //self.postMessage(x);
        log(x);
    });
    const model_weights = await PipelineSingleton.getModelBuffer(x => {
        // We also add a progress callback to the pipeline so that we can
        // track model loading.
        //self.postMessage(x);
        log(x);
    });

    //adapted from pipeline.js FeatureExtractionPipeline._call(texts, {
    //     pooling = /** @type {'none'} */('none'),
    //     normalize = false,
    // } = {})
    const model_inputs = await tokenizer(sentences, {
        padding: true,
        truncation: true,
    });
    //console.log("input_ids=",model_inputs.input_ids);
    log("model_inputs=", model_inputs);

    // create session, set options
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
    let session = await ort.InferenceSession.create(model_weights, opt);
    log("session.inputNames", session.inputNames);
    log("session.outputNames", session.outputNames);

    let encoder_outputs = await encoderForward(session, model_inputs);
    log("encoder_outputs=", encoder_outputs);

    let result_tensor = encoder_outputs.last_hidden_state ?? encoder_outputs.logits;
    //pooling === 'mean'
    result_tensor = mean_pooling(result_tensor, model_inputs.attention_mask);
    //normalize === true
    result_tensor = result_tensor.normalize(2, -1);
    log("WebGPU result=", JSON.stringify(result_tensor, null, 2));
});