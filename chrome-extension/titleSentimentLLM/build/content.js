/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.

const getSentiment = async (text) => {
    const message = {
        action: 'classify',
        text: text,
    };

    // Wrap chrome.runtime.sendMessage in a Promise so we can await it
    const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });

    // Format the response as a JSON string with indentation
    return JSON.stringify(response, null, 2);
};

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0]; // Get the active tab in the current window

    // display title
    const title = activeTab.title;
    document.getElementById('title').innerText = title;
    // Wait for the sentiment analysis result before displaying it
    try {
        const sentiment = await getSentiment(title);
        document.getElementById('sentiment').innerText = sentiment;
    } catch (error) {
        console.error("Error classifying sentiment:", error);
    }
});
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOztVQUFBO1VBQ0E7Ozs7O1dDREE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7QUNOQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7O0FBRUw7QUFDQTtBQUNBOztBQUVBLG9CQUFvQixtQ0FBbUM7QUFDdkQsK0JBQStCOztBQUUvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsQ0FBQyxFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcHlyb2Jsb2NrZXItbGxtL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3B5cm9ibG9ja2VyLWxsbS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3B5cm9ibG9ja2VyLWxsbS8uL3NyYy9jb250ZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRoZSByZXF1aXJlIHNjb3BlXG52YXIgX193ZWJwYWNrX3JlcXVpcmVfXyA9IHt9O1xuXG4iLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBjb250ZW50LmpzIC0gdGhlIGNvbnRlbnQgc2NyaXB0cyB3aGljaCBpcyBydW4gaW4gdGhlIGNvbnRleHQgb2Ygd2ViIHBhZ2VzLCBhbmQgaGFzIGFjY2Vzc1xuLy8gdG8gdGhlIERPTSBhbmQgb3RoZXIgd2ViIEFQSXMuXG5cbmNvbnN0IGdldFNlbnRpbWVudCA9IGFzeW5jICh0ZXh0KSA9PiB7XG4gICAgY29uc3QgbWVzc2FnZSA9IHtcbiAgICAgICAgYWN0aW9uOiAnY2xhc3NpZnknLFxuICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgIH07XG5cbiAgICAvLyBXcmFwIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlIGluIGEgUHJvbWlzZSBzbyB3ZSBjYW4gYXdhaXQgaXRcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEZvcm1hdCB0aGUgcmVzcG9uc2UgYXMgYSBKU09OIHN0cmluZyB3aXRoIGluZGVudGF0aW9uXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLCBudWxsLCAyKTtcbn07XG5cbmNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0sIGFzeW5jICh0YWJzKSA9PiB7XG4gICAgY29uc3QgYWN0aXZlVGFiID0gdGFic1swXTsgLy8gR2V0IHRoZSBhY3RpdmUgdGFiIGluIHRoZSBjdXJyZW50IHdpbmRvd1xuXG4gICAgLy8gZGlzcGxheSB0aXRsZVxuICAgIGNvbnN0IHRpdGxlID0gYWN0aXZlVGFiLnRpdGxlO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aXRsZScpLmlubmVyVGV4dCA9IHRpdGxlO1xuICAgIC8vIFdhaXQgZm9yIHRoZSBzZW50aW1lbnQgYW5hbHlzaXMgcmVzdWx0IGJlZm9yZSBkaXNwbGF5aW5nIGl0XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc2VudGltZW50ID0gYXdhaXQgZ2V0U2VudGltZW50KHRpdGxlKTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbnRpbWVudCcpLmlubmVyVGV4dCA9IHNlbnRpbWVudDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2xhc3NpZnlpbmcgc2VudGltZW50OlwiLCBlcnJvcik7XG4gICAgfVxufSk7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9