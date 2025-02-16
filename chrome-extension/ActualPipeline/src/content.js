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
 * @param {Array<string>} pageData.p_elements - The paragraph elements of the page.
 * @param {Array<string>} pageData.h1_elements - The H1 heading elements of the page.
 * @param {Array<string>} pageData.h2_elements - The H2 heading elements of the page.
 * @param {Array<string>} pageData.internal_links - The internal links on the page.
 * @param {Array<string>} pageData.external_links - The external links on the page.
 *
 * @returns {Object} The collected page data.
 */
function getData() {
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

    // 4. <p> elements: Collect text from all <p> tags (filtering out empties)
    const p_elements = Array.from(document.querySelectorAll("p"))
                            .map(p => p.textContent.trim())
                            .filter(text => text.length > 0);

    // 5. <h> elements: Collect main (<h1>) and secondary (<h2>) headers
    const h1_elements = Array.from(document.querySelectorAll("h1"))
                            .map(h1 => h1.textContent.trim())
                            .filter(text => text.length > 0);
    const h2_elements = Array.from(document.querySelectorAll("h2"))
                            .map(h2 => h2.textContent.trim())
                            .filter(text => text.length > 0);

    // 6. Links: Separate into internal and external
    const allLinks = Array.from(document.querySelectorAll("a[href]"));
    const domain = window.location.hostname;
    const internal_links = [];
    const external_links = [];

    allLinks.forEach(a => {
        let href = a.getAttribute("href");
        if (!href) return;
        try {
        // Resolve relative URLs against the current URL
        const linkUrl = new URL(href, window.location.href);
        if (linkUrl.hostname === domain) {
            internal_links.push(linkUrl.href);
        } else {
            external_links.push(linkUrl.href);
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
        p_elements,
        h1_elements,
        h2_elements,
        internal_links,
        external_links
    };

    return dataPoint;
}
  

/**
 * Send a message to the background script to classify the sentiment of the given text
 * @param {*} text the text to classify
 */
const classify = async (pageData) => {
    const message = {
        target: 'background',
        action: 'classify',
        pageData: pageData,
    };

    chrome.runtime.sendMessage(message);
};

const blockPage = async () => {
    location.replace("https://www.google.com");
}

const pageData = getData();
console.log(JSON.stringify(pageData, null, 2));

const pipeline = new ClassificationPipeline(3);
const processed_pageData = pipeline.preprocess(pageData);
console.log(JSON.stringify(processed_pageData, null, 2));
await classify(processed_pageData);