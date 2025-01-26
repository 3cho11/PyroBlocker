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
/*!**********************!*\
  !*** ./src/popup.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
// popup.js - handles interaction with the extension's popup, sends requests to the

const message = {
    action: 'getTitleAndSentiment',
};

chrome.runtime.sendMessage(message, (response) => {
    if (response) {
        console.log('sentiment at popup:', response.sentiment);
        document.getElementById('title').innerText = response.title || 'No title available';
        document.getElementById('label').innerText = response.sentiment.label || 'No label available';
        document.getElementById('score').innerText = response.sentiment.score || 'No score available';
    } else {
        // if there exists a previous response we can just show that one
        if (document.getElementById('title')==='') {
            document.getElementById('title').innerText = 'Error fetching title';
            document.getElementById('label').innerText = 'Error fetching label';
            document.getElementById('score').innerText = 'Error fetching score';
        }
    }
});
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6Ijs7VUFBQTtVQUNBOzs7OztXQ0RBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcHlyb2Jsb2NrZXItbGxtL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3B5cm9ibG9ja2VyLWxsbS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3B5cm9ibG9ja2VyLWxsbS8uL3NyYy9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGUgcmVxdWlyZSBzY29wZVxudmFyIF9fd2VicGFja19yZXF1aXJlX18gPSB7fTtcblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gcG9wdXAuanMgLSBoYW5kbGVzIGludGVyYWN0aW9uIHdpdGggdGhlIGV4dGVuc2lvbidzIHBvcHVwLCBzZW5kcyByZXF1ZXN0cyB0byB0aGVcclxuXHJcbmNvbnN0IG1lc3NhZ2UgPSB7XHJcbiAgICBhY3Rpb246ICdnZXRUaXRsZUFuZFNlbnRpbWVudCcsXHJcbn07XHJcblxyXG5jaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlLCAocmVzcG9uc2UpID0+IHtcclxuICAgIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdzZW50aW1lbnQgYXQgcG9wdXA6JywgcmVzcG9uc2Uuc2VudGltZW50KTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGl0bGUnKS5pbm5lclRleHQgPSByZXNwb25zZS50aXRsZSB8fCAnTm8gdGl0bGUgYXZhaWxhYmxlJztcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGFiZWwnKS5pbm5lclRleHQgPSByZXNwb25zZS5zZW50aW1lbnQubGFiZWwgfHwgJ05vIGxhYmVsIGF2YWlsYWJsZSc7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlJykuaW5uZXJUZXh0ID0gcmVzcG9uc2Uuc2VudGltZW50LnNjb3JlIHx8ICdObyBzY29yZSBhdmFpbGFibGUnO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBpZiB0aGVyZSBleGlzdHMgYSBwcmV2aW91cyByZXNwb25zZSB3ZSBjYW4ganVzdCBzaG93IHRoYXQgb25lXHJcbiAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aXRsZScpPT09JycpIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpdGxlJykuaW5uZXJUZXh0ID0gJ0Vycm9yIGZldGNoaW5nIHRpdGxlJztcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhYmVsJykuaW5uZXJUZXh0ID0gJ0Vycm9yIGZldGNoaW5nIGxhYmVsJztcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlJykuaW5uZXJUZXh0ID0gJ0Vycm9yIGZldGNoaW5nIHNjb3JlJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==