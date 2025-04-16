// classificationPipeline.js

import { PreTrainedTokenizer } from '@xenova/transformers';

export class ClassificationPipeline {
    /**
     * Creates an instance of the class with specified lengths for various elements.
     * 
     * @constructor
     * @param {number} [p_LENGTH=1] - number of paragraph elements to do classification on
     * @param {number} [h1_LENGTH=1] - number of H1 header elements to do classification on
     * @param {number} [h2_LENGTH=1] - number of H2 header elements to do classification on
     * @param {number} [internal_links_LENGTH=1] - number of internal links to do classification on
     * @param {number} [external_links_LENGTH=1] - number of external links to do classification on
     * 
     * ... finish this ****************
     */
    constructor(p_LENGTH=1, h1_LENGTH=1, h2_LENGTH=1, p_POWER=1, h1_POWER=1, h2_POWER=1, regression_weights=[["url", 1], ["title", 1], ["description", 1],["p_elements", 1], ["h1_elements", 1], ["h2_elements", 1], ["internal_links", 1], ["external_links", 1]]) {
        this.offscreenPortName = "offscreen";
        // for cropping
        this.p_LENGTH = p_LENGTH;
        this.h1_LENGTH = h1_LENGTH;
        this.h2_LENGTH = h2_LENGTH;

        // for power mean
        this.p_POWER = p_POWER;
        this.h1_POWER = h1_POWER;
        this.h2_POWER = h2_POWER;

        // for logistic regression
        this.regression_weights = new Map(regression_weights);
    }


    // remove duplicates, crop arrays to specified LENGTHs, combine same-field sentences to 1 string
    preprocess = (pageData) => {

        // Helper function to remove duplicates from an array
        const removeDuplicates = (arr) => {
            return arr.filter((value, index, self) => self.indexOf(value) === index);
        }
        const removeDuplicatesFromArrays = (textData) => {
            return {
                ...textData,
                p_elements: removeDuplicates(textData.p_elements),
                h1_elements: removeDuplicates(textData.h1_elements),
                h2_elements: removeDuplicates(textData.h2_elements)
            };
        }

        const cropData = (textData) => {
            return {
                ...textData,
                p_elements: textData.p_elements.slice(0, this.p_LENGTH),
                h1_elements: textData.h1_elements.slice(0, this.h1_LENGTH),
                h2_elements: textData.h2_elements.slice(0, this.h2_LENGTH)
            };
        }

        const combineSentences = (textData) => {
            return {
                ...textData,
                p_elements: textData.p_elements.join(" "),
                h1_elements: textData.h1_elements.join(" "),
                h2_elements: textData.h2_elements.join(" ")
            };
        }
        
        // remove duplicates from each array in textData
        const no_duplicates_textData = removeDuplicatesFromArrays(textData);
        // crop number of array elements to pre-decided size
        const cropped_textData = cropData(no_duplicates_textData);
        // combine each sentence in the array into a single string so each field as 1 element
        const one_element_per_field_textData = combineSentences(cropped_textData);

        return one_element_per_field_textData;
    }

    // utility function to fetch files from the local model path
    static getFile = async (filename) => {

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

    async getTokenizer() {
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

    tokenize = async (textData, tokenizer) => {

        encoded_textData = {};
        for (const [key, value] of Object.entries(textData)) {
            // if value exists
            if (value) {
                const model_inputs = await tokenizer(sentences, {
                    padding: false,
                    truncation: false,
                });
                // Add the model inputs to the textData object
                textData[key] = model_inputs.input_ids;  
            }

        return encoded_textData;
    }

    batch = (encoded_textData, tokenizer) => {

        const max_length = tokenizer.config.max_position_embeddings;
        const fullStopId = tokenizer.encode('.').input_ids[0]; // Assuming '.' is the full stop token
            
        const smartBatching = (encoded) => {
            const { input_ids, attention_mask } = encoded;
            const length = input_ids.length;
            const batches = [];

            // Get sentence-ending token IDs (., !, ?)
            const sentenceEndTokenIds = ['.', '!', '?']
                .map(p => tokenizer.encode(p).input_ids[0])
                .filter(Boolean); // Avoid undefined

            const isSentenceEnd = (tokenId) => sentenceEndTokenIds.includes(tokenId);

            if (length <= max_length) {
                batches.push({ input_ids, attention_mask });
            } else if (length <= max_length * 1.5) {
                // Truncate to nearest sentence end before max_length
                let splitIndex = max_length;
                while (splitIndex > 0 && !isSentenceEnd(input_ids[splitIndex])) {
                    splitIndex--;
                }

                if (splitIndex === 0) splitIndex = max_length;

                batches.push({
                    input_ids: input_ids.slice(0, splitIndex + 1),
                    attention_mask: attention_mask.slice(0, splitIndex + 1),
                });

                // Optional: Handle or discard the remainder if needed
            } else {
                // Large overflow – split into multiple batches at sentence ends
                let start = 0;
                while (start < length) {
                    let end = Math.min(start + max_length, length);
                    let splitIndex = end - 1;

                    // Look backwards for the last sentence end
                    while (splitIndex > start && !isSentenceEnd(input_ids[splitIndex])) {
                        splitIndex--;
                    }

                    // If no sentence end found, hard split
                    if (splitIndex === start) {
                        splitIndex = end - 1;
                    }

                    batches.push({
                        input_ids: input_ids.slice(start, splitIndex + 1),
                        attention_mask: attention_mask.slice(start, splitIndex + 1),
                    });

                    start = splitIndex + 1;
                }
            }

            return batches;
        };

    
        const batched_data = {};
        for (const [key, value] of Object.entries(encoded_textData)) {
            if (value) {
                batched_data[key] = smartBatching(value);
            }
        }
    
        return batched_data;
    };
    
    
    /**
     * Computes the power mean (generalized mean) of an array of numbers.
     *
     * @param {number[]} arr - The array of numbers to compute the power mean for.
     * @param {number} [p=1] - The power to which each element is raised. Defaults to 1 (arithmetic mean).
     * @returns {number} The power mean of the array.
     */
    powerMean = (arr, p=1) => {
        // define a function to compute powers while maintaining the sign
        const power = (x, p) => {
            if (x < 0) {
                return -Math.pow(-x, p);
            } else {
                return Math.pow(x, p);
            }
        };

        // compute the sum of the pth powers of the elements of arr
        const sum = arr.reduce((acc, x) => acc + power(x, p), 0);
        // divide by n and raise to 1/p
        return power(sum / arr.length, 1 / p);
    }

    getLabel = (score) => {
        return score > 0 ? "ADULT" : "SAFE";
    }

    sendPortMessage = async (port_name, message) => {
        // Wrap chrome.runtime.sendMessage in a Promise so we can await it
        return new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: port_name });

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
        }).catch((error) => {
            // Log the error with additional debugging information
            if (error instanceof Error) {
                console.error("Error in sendPortMessage function:", error.message);
            } else if (typeof error === "object") {
                console.error("Error in sendPortMessage function:", JSON.stringify(error, null, 2));
            } else {
                console.error("Error in sendPortMessage function:", String(error));
            }

            throw error; // Optionally rethrow to propagate it further
        });
    }

    /**
     * Classifies the elements in the provided page data.
     * 
     * This function creates an offscreen document if one does not already exist,
     * then sends a message to the offscreen document to classify the elements in the page data.
     * It returns a Promise that resolves with the classification results or rejects with an error.
     * 
     * @param {Object} pageData - The data of the page elements to be classified.
     */
    classifyInOffscreen = async (pageData) => {
        const port_name = "offscreen";
        const message = {
            action: "classify",
            pageData: pageData
        };
        return this.sendPortMessage(port_name, message);
    }

    /**
     * Sends data from content.js to background.js for classification
     * 
     * @param {Object} pageData - The data of the page elements to be classified.
     */
    classify = async (pageData) => {
        // const port_name = "background";
        // // since the port is named offscreen we won't also pass a target attribute
        const port_name = "background";
        const message = {
            action: "classify",
            pageData: pageData
        };
        return this.sendPortMessage(port_name, message);
    }


    /**
     * Take each array-type element in pageData and return a singular value - the power mean
     * The power mean can be negative since our power function maintains the sign of the input
     * 
     * We use our pre-existing _POWER variables to determine the power of each array
     * 
     * @param {Object} pageData 
     * 
     * @returns {Object} pageData with power mean applied to each array-type element
     */
    powerMeanAllArrays = (pageData) => {
        // Helper function to apply powerMean only if the array has not been set to 0 due to being empty
        const applyPowerMean = (arr, power) => {
            return (arr !== 0) ? this.powerMean(arr, power) : arr;
        };

        // Create result object, only including fields with non-empty arrays
        const result = {
            ...pageData,
            p_elements: applyPowerMean(pageData.p_elements, this.p_POWER),
            h1_elements: applyPowerMean(pageData.h1_elements, this.h1_POWER),
            h2_elements: applyPowerMean(pageData.h2_elements, this.h2_POWER),
            internal_links: applyPowerMean(pageData.internal_links, this.internal_links_POWER),
            external_links: applyPowerMean(pageData.external_links, this.external_links_POWER)
        };
        return result;
    }

    /**
     * Logistic regression to get a singular value from the pageData
     * 
     * @param {Object} pageData - json object with { type: score } for each type
     * 
     * @returns {float} score of the logistic regression
     */
    logisticRegression = (pageData) => {

        // get the weighted sum of the pageData
        const weightedSum = Object.entries(pageData).reduce((acc, [type, score]) => {
            return acc + score * this.regression_weights.get(type);
        }, 0);

        return Math.tanh(weightedSum);
    }
}