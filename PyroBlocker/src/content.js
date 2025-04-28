console.log("content.js");
// import preprocessing
import { ClassificationPipeline } from "./classificationPipeline.js";


/**
 * Collects the current page's data and returns an object matching the specified format.
 *
 * Format:
 * @param {Object} pageData - The data of the page to extract text from.
 * @param {string} pageData.url - The URL of the page.
 * @param {string} pageData.title - The title of the page.
 * @param {string} pageData.description - The description of the page.
 * @param {Array<string>} pageData.h1_elements - The H1 heading elements of the page.
 * @param {Array<string>} pageData.h2_elements - The H2 heading elements of the page.
 * @param {Array<string>} pageData.p_elements - The paragraph elements of the page.
 * @param {Array<string>} pageData.internal_links - The internal links on the page.
 * @param {Array<string>} pageData.external_links - The external links on the page.
 *
 * @returns {Object} The collected page data.
 */
const getData = () => {
    // 1. URL
    const url = window.location.href;

    // 2. Title: Prefer meta tags if available, otherwise fallback to document.title
    let title = '';
    const metaTitle = document.querySelector('meta[name="title"]') ||
        document.querySelector('meta[property="og:title"]');
    if (metaTitle && metaTitle.getAttribute("content")) {
        title = metaTitle.getAttribute("content").trim();
    } else {
        title = document.title.trim();
    }

    // 3. Description: Check for meta description tags
    let description = '';
    const metaDescription = document.querySelector('meta[name="description"]') ||
        document.querySelector('meta[property="og:description"]');
    if (metaDescription && metaDescription.getAttribute("content")) {
        description = metaDescription.getAttribute("content").trim();
    }

    // 4. <h> elements: Collect main (<h1>) and secondary (<h2>) headers
    const h1_elements = Array.from(document.querySelectorAll("h1"))
        .map(h1 => h1.textContent.trim())
        .filter(text => text.length > 0);
    const h2_elements = Array.from(document.querySelectorAll("h2"))
        .map(h2 => h2.textContent.trim())
        .filter(text => text.length > 0);

    // 5. <p> elements: Collect text from all <p> tags (filtering out empties)
    const p_elements = Array.from(document.querySelectorAll("p"))
        .map(p => p.textContent.trim())
        .filter(text => text.length > 0);

    // 6. Links: Separate into internal and external
    const allLinks = Array.from(document.querySelectorAll("a[href]"));
    const domain = window.location.hostname;
    // we choose to count links instead of storing them
    let internal_links_count = 0;
    let external_links_count = 0;

    allLinks.forEach(a => {
        let href = a.getAttribute("href");
        if (!href) return;
        try {
            // Resolve relative URLs against the current URL
            const linkUrl = new URL(href, window.location.href);
            if (linkUrl.hostname === domain) {
                internal_links_count += 1;
            } else {
                external_links_count += 1;
            }
        } catch (e) {
            // If URL construction fails, skip this link.
        }
    });

    // Build the final data object.
    const dataPoint = {
        url,
        title,
        description,
        h1_elements,
        h2_elements,
        p_elements,
        internal_links_count,
        external_links_count
    };

    return dataPoint;
}


const blockPage = async () => {
    console.log("____________BLOCKING PAGE____________\n");
    // location.replace("https://www.google.com");
}


// check if enabled
(async function init() {

    // if disabled, do nothing
    const { pyroEnabled } = await chrome.storage.local.get('pyroEnabled');
    const isEnabled = pyroEnabled === true;
    console.log('isEnabled:', isEnabled);
    if (!isEnabled) {
        console.log("____________EXTENSION DISABLED____________\n");
        return; // Early return stops the whole async init function
    }



    // if current page is whitelisted, do nothing
    const { whitelist = [] } = await chrome.storage.local.get('whitelist');
    if (whitelist.includes(window.location.href)) {
        console.log("____________PAGE IS WHITELISTED____________\n");
        return;  // Early return stops the whole async init function
    }

    // if current page is blacklisted, block it
    const { blacklist = [] } = await chrome.storage.local.get('blacklist');
    if (blacklist.includes(window.location.href)) {
        console.log("____________PAGE IS BLACKLISTED____________\n");
        blockPage();
        return;  // Early return stops the whole async init function
    }



    // do inference

    // data collection

    const pageData = getData();
    console.log("____________RAW DATA____________\n\n" + JSON.stringify(pageData, null, 2));

    // text-based data for LLM classification
    const textData = {
        title: pageData.title,
        description: pageData.description,
        h1_elements: pageData.h1_elements,
        h2_elements: pageData.h2_elements,
        p_elements: pageData.p_elements
    };

    const pipeline = new ClassificationPipeline(5, 5, 5);


    // pre-processing

    const preprocessed_textData = pipeline.preprocess(textData);
    console.log("____________DUPLICATES REMOVED, ARRAYS CROPPED, AND JOINED____________\n\n" + JSON.stringify(preprocessed_textData, null, 2).split("\n"));


    // tokenization

    const tokenizer = await pipeline.getTokenizer();

    const encoded_textData = await pipeline.tokenize(preprocessed_textData, tokenizer);
    console.log("____________TOKENIZATION____________\n\n" + pipeline.stringifyBigInt(encoded_textData, 5));


    // batching

    const batches = pipeline.batch(encoded_textData, tokenizer);
    console.log("____________BATCHING____________\n\n" + pipeline.stringifyBigInt(batches, 5));
    console.log("batch 1:", batches[0]);


    // classification (content -> background -> offscreen)

    const { scores, inference_time } = await pipeline.classify(batches);
    console.log("____________LLM SCORES____________\n (fields with missing values set to 0)\n\n"
        + JSON.stringify(scores, null, 2));
    console.log("____________INFERENCE TIME____________\n\n" + inference_time + " ms");

    // take average of scores (our custom method preserves negatives)
    const final_score = pipeline.powerMean(scores, 2);

    // final decision
    const final_prediction = pipeline.getLabel(final_score);
    console.log("____________FINAL PREDICTION____________\n\n" + "label = " + final_prediction);


    // block page if adult
    if (final_prediction === "ADULT") {
        blockPage();
    }
})();