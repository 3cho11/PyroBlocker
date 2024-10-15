console.log('get-page-data.js loaded');

// Scrape URL and raw HTML content
const pageData = {
    url: window.location.href,                  // The current page's URL
    html: document.documentElement.outerHTML    // The entire page's HTML content
};

// Store the URL as the key and the HTML as the value
chrome.storage.local.set({ [pageData.url]: pageData.html }, () => {
    if (chrome.runtime.lastError) {
        console.error('Error saving page data:', chrome.runtime.lastError);
    } else {
        console.log('Page data successfully saved:', pageData.url);
    }
});