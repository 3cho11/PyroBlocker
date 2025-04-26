// classificationPipeline.js

import { PreTrainedTokenizer } from '@xenova/transformers';

export class ClassificationPipeline {    
    /**
     * Creates an instance of the class with specified lengths for various elements.
     * 
     * @constructor
     * @param {number} [h1_LENGTH=1] - number of H1 header elements to do classification on
     * @param {number} [h2_LENGTH=1] - number of H2 header elements to do classification on
     * @param {number} [p_LENGTH=1] - number of paragraph elements to do classification on
     * 
     */
    constructor(h1_LENGTH=1, h2_LENGTH=1, p_LENGTH=1) {
        this.offscreenPortName = "offscreen";
        // for cropping
        this.h1_LENGTH = h1_LENGTH;
        this.h2_LENGTH = h2_LENGTH;
        this.p_LENGTH = p_LENGTH;
    }

    // stringify strings with bigInt then crop output to n characters
    stringifyBigInt(obj, crop = null) {
        const isNumericKeyedObject = (value) => {
            if (
                typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)
            ) {
                const keys = Object.keys(value);
                return keys.every(k => /^\d+$/.test(k));
            }
            return false;
        };
    
        const cropObject = (value, crop) => {
            const keys = Object.keys(value);
            const cropped = {};
            for (let i = 0; i < Math.min(crop, keys.length); i++) {
                const key = keys[i];
                cropped[key] = value[key];
            }
            if (keys.length > crop) {
                cropped[`...`] = `and ${keys.length - crop} more`;
            }
            return cropped;
        };
    
        const replacer = (key, value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
    
            if (Array.isArray(value) && crop && value.length > crop) {
                return value.slice(0, crop).concat(`... and ${value.length - crop} more`);
            }
    
            if (typeof value === 'string' && crop && value.length > crop) {
                return value.slice(0, crop) + `... and ${value.length - crop} more chars`;
            }
    
            if (isNumericKeyedObject(value) && crop) {
                return cropObject(value, crop);
            }
    
            return value;
        };
    
        try {
            return JSON.stringify(obj, replacer, 2);
        } catch (err) {
            console.error("Error stringifying object with BigInts:", err);
            return String(obj);
        }
    }

    // check if extension is enabled
    isEnabled = () => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['pyroEnabled'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error("Error retrieving pyroEnabled:", chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    const isEnabled = result.pyroEnabled === true || result.pyroEnabled === "true";
                    resolve(isEnabled);
                }
            });
        });
    }

    // remove duplicates, crop arrays to specified LENGTHs, combine same-field sentences to 1 string
    preprocess = (textData) => {
        // Helper function to remove duplicates from an array
        const removeDuplicates = (arr) => {
            return arr.filter((value, index, self) => self.indexOf(value) === index);
        }
        const removeDuplicatesFromArrays = (textData) => {
            return {
                ...textData,
                h1_elements: removeDuplicates(textData.h1_elements),
                h2_elements: removeDuplicates(textData.h2_elements),
                p_elements: removeDuplicates(textData.p_elements)
            };
        }

        const cropData = (textData) => {
            return {
                ...textData,
                h1_elements: textData.h1_elements.slice(0, this.h1_LENGTH),
                h2_elements: textData.h2_elements.slice(0, this.h2_LENGTH),
                p_elements: textData.p_elements.slice(0, this.p_LENGTH)
            };
        }

        // add fullstop to separate array items if a fullstop isn't present.
        const ensureSentence = (text) => {
            text = text.trim();
            return /[.!?]$/.test(text) ? text : text + '.';
        };

        const combineSentences = (textData) => {
            return {
                ...textData,
                h1_elements: textData.h1_elements.map(ensureSentence).join(" "),
                h2_elements: textData.h2_elements.map(ensureSentence).join(" "),
                p_elements: textData.p_elements.map(ensureSentence).join(" ")
            };
        };
        /**
         * Convert a document’s fields into one “hybrid” sequence with explicit markers.
         *
         * @param {Object} textData
         *   e.g. {
         *     title:       "My Title",
         *     description: "Short desc.",
         *     p_elements:  "Full paragraph…",
         *     h1_elements: "Heading 1 text",
         *     h2_elements: "Heading 2 text"
         *   }
         * @returns {string}
         *   "[TITLE] My Title [DESC] Short desc. [BODY] Full paragraph… [H1] Heading 1 text [H2] Heading 2 text"
         */
        function hybridLabelConcat(textData) {
            // Define the order & labels you want
            const fieldOrder = [
            "title",
            "description",
            "h1_elements",
            "h2_elements",
            "p_elements"
            ];
            const labels = {
            title:       "Title: ",
            description: "Description: ",
            p_elements:  "Body: ",
            h1_elements: "Main heading(s): ",
            h2_elements: "Subheading(s): "
            };
        
            const parts = [];
            for (const key of fieldOrder) {
            if (!(key in textData)) continue;
            let value = textData[key];
            
            // Skip empty
            if (typeof value !== "string" || !value.trim()) continue;
        
            parts.push(`${labels[key]} ${value.trim()}`);
            }
        
            // join with '\n' (line breaks)
            return parts.join("\n");
        }
        
        // remove duplicates from each array in textData
        const no_duplicates_textData = removeDuplicatesFromArrays(textData);
        // crop number of array elements to pre-decided size
        const cropped_textData = cropData(no_duplicates_textData);
        // combine each sentence in the array into a single string so each field as 1 element
        const one_element_per_field_textData = combineSentences(cropped_textData);
        // combine all fields into a single string with labels
        const labelled_string = hybridLabelConcat(one_element_per_field_textData);
        
        return labelled_string;
    }


    sendPortMessage = async (port_name, message) => {
        // Wrap chrome.runtime.sendMessage in a Promise so we can await it
        return new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: port_name });

            const cleanup = () => {
                try {
                    port.disconnect();
                } catch (e) {
                    console.warn("Port already disconnected");
                }
            };

            port.onMessage.addListener((response) => {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error));
                }
                cleanup() // Close the port after response
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

    async getTokenizer() {
        
        const message = {
            action: "getTokenizer"
        };
        const response = await this.sendPortMessage("background", message);
        // if specialTokensMap exists, add it to the tokenizer
        if (response.specialTokensMap) {
            response.tokenizer.added_tokens = response.specialTokensMap.added_tokens || response.tokenizer.added_tokens;
        }

        // use in-built PreTrainedTokenizer class to format a correct tokenizer instance:
        const tokenizer = new PreTrainedTokenizer(response.tokenizer, response.tokenizerConfig);
        tokenizer.config = response.tokenizerConfig;

        // The instance should now be ready for tokenization/inference:
        console.log("Tokenizer loaded:", tokenizer);
        return tokenizer;
    }

    tokenize = async (textData, tokenizer) => {

        // tensors use BigInt under the hood preventing them being send between scripts without serialisation
        // thus, it is more efficient to use regular arrays
        const encoded_textData = tokenizer(textData, {
            padding:    false,
            truncation: false,
            add_special_tokens: true,
            return_tensor: false
        });        
      
        return encoded_textData;
    };
      

    batch = (encoded_textData, tokenizer) => {

        const max_length = tokenizer.config.model_max_length || 512; // Default to 512 if not specified

        const smartBatching = (encoded) => {
            const { input_ids, attention_mask } = encoded;
            const length = input_ids.length;
            const batches = [];

            // Get sentence-ending token IDs (., !, ?)
            const sentenceEndTokenIds = ['.', '!', '?']
                .map(p => tokenizer.encode(p)[0])
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
                    input_ids: input_ids.slice(0, splitIndex),
                    attention_mask: attention_mask.slice(0, splitIndex),
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

        const batches = smartBatching(encoded_textData);
    
        return batches;
    };

    

    /**
     * Classifies the elements in the provided page data.
     * 
     * This function creates an offscreen document if one does not already exist,
     * then sends a message to the offscreen document to classify the elements in the page data.
     * It returns a Promise that resolves with the classification results or rejects with an error.
     * 
     * @param {Object} data - The data of the page elements to be classified.
     */
    classifyInOffscreen = async (data) => {
        const port_name = "offscreen";
        const message = {
            action: "classify",
            data: data
        };
        return this.sendPortMessage(port_name, message);
    }

    /**
     * Sends data from content.js to background.js for classification
     * 
     * @param {Object} batches - The data of the page elements to be classified.
     */
    classify = async (batches) => {
        // const port_name = "background";
        // // since the port is named offscreen we won't also pass a target attribute
        const port_name = "background";
        const message = {
            action: "classify",
            data: batches
        };
        return this.sendPortMessage(port_name, message);
    }

    /**
     * Computes the power mean (generalized mean) of an array of numbers while preserving the sign of each number.
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