// classificationPipeline.js

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
    constructor(p_LENGTH=1, h1_LENGTH=1, h2_LENGTH=1, internal_links_LENGTH=1, external_links_LENGTH=1, p_POWER=1, h1_POWER=1, h2_POWER=1, internal_links_POWER=1, external_links_POWER=1, regression_weights=[["url", 1], ["title", 1], ["description", 1],["p_elements", 1], ["h1_elements", 1], ["h2_elements", 1], ["internal_links", 1], ["external_links", 1]]) {
        this.offscreenPortName = "offscreen";
        // for cropping
        this.p_LENGTH = p_LENGTH;
        this.h1_LENGTH = h1_LENGTH;
        this.h2_LENGTH = h2_LENGTH;
        this.internal_links_LENGTH = internal_links_LENGTH;
        this.external_links_LENGTH = external_links_LENGTH;
        // for power mean
        this.p_POWER = p_POWER;
        this.h1_POWER = h1_POWER;
        this.h2_POWER = h2_POWER;
        this.internal_links_POWER = internal_links_POWER;
        this.external_links_POWER = external_links_POWER;
        // for logistic regression
        this.regression_weights = new Map(regression_weights);
    }

    // remove duplicates then crop arrays to specified LENGTHs
    preprocess = (pageData) => {
        // Helper function to remove duplicates from an array
        const removeDuplicates = (arr) => {
            return arr.filter((value, index, self) => self.indexOf(value) === index);
        }

        const removeDuplicatesFromArrays = (pageData) => {
            return {
                ...pageData,
                p_elements: removeDuplicates(pageData.p_elements),
                h1_elements: removeDuplicates(pageData.h1_elements),
                h2_elements: removeDuplicates(pageData.h2_elements),
                internal_links: removeDuplicates(pageData.internal_links),
                external_links: removeDuplicates(pageData.external_links)
            };
        }

        const cropData = (pageData) => {
            return {
                ...pageData,
                p_elements: pageData.p_elements.slice(0, this.p_LENGTH),
                h1_elements: pageData.h1_elements.slice(0, this.h1_LENGTH),
                h2_elements: pageData.h2_elements.slice(0, this.h2_LENGTH),
                internal_links: pageData.internal_links.slice(0, this.internal_links_LENGTH),
                external_links: pageData.external_links.slice(0, this.external_links_LENGTH)
            };
        }
        
        const cleanUrl = (url, domain=null) => {
            /** 
             * Remove query parameters and occurrences of uninformative substrings from the URL.
             */
            
            // Remove everything after '?' (query parameters)
            url = url.split('?')[0];
        
            // Define substrings based on whether the URL is external or internal
            let substringList = (domain === null) // if external
                ? ['https://', 'http://', 'www.', '.com/', '.com', '.org/', '.org', '.net/', '.net', '.php', '.html']
                : [domain, '.php', '.html']; // if internal
        
            // Remove specified substrings from the URL
            substringList.forEach(substring => {
                url = url.replaceAll(substring, '');
            });
        
            // Remove leading and trailing slashes
            if (url.startsWith('/')) {
                url = url.slice(1);
            }
            if (url.endsWith('/')) {
                url = url.slice(0, -1);
            }
        
            return url;
        }

        const domain = pageData.url;
        const processLinks = (pageData) => {
            return {
                ...pageData,
                url: cleanUrl(pageData.url),
                internal_links: pageData.internal_links.map(link => cleanUrl(link, domain)),
                external_links: pageData.external_links.map(link => cleanUrl(link))
            };
        }
           
        const set_pageData = removeDuplicatesFromArrays(pageData);
        const cropped_pageData = cropData(set_pageData);


        const processed_pageData = processLinks(cropped_pageData);
        return processed_pageData;
    }

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