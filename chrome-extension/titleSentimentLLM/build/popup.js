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
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

// const inputElement = document.getElementById('text');
// const outputElement = document.getElementById('output');

// // Listen for changes made to the textbox.
// inputElement.addEventListener('input', (event) => {

//     // Bundle the input data into a message.
//     const message = {
//         action: 'classify',
//         text: event.target.value,
//     }

//     // Send this message to the service worker.
//     chrome.runtime.sendMessage(message, (response) => {
//         // Handle results returned by the service worker (`background.js`) and update the popup's UI.
//         outputElement.innerText = JSON.stringify(response, null, 2);
//     });
// });

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6Ijs7VUFBQTtVQUNBOzs7OztXQ0RBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7O0FDTkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUixJQUFJIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcHlyb2Jsb2NrZXItbGxtL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3B5cm9ibG9ja2VyLWxsbS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3B5cm9ibG9ja2VyLWxsbS8uL3NyYy9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGUgcmVxdWlyZSBzY29wZVxudmFyIF9fd2VicGFja19yZXF1aXJlX18gPSB7fTtcblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gcG9wdXAuanMgLSBoYW5kbGVzIGludGVyYWN0aW9uIHdpdGggdGhlIGV4dGVuc2lvbidzIHBvcHVwLCBzZW5kcyByZXF1ZXN0cyB0byB0aGVcbi8vIHNlcnZpY2Ugd29ya2VyIChiYWNrZ3JvdW5kLmpzKSwgYW5kIHVwZGF0ZXMgdGhlIHBvcHVwJ3MgVUkgKHBvcHVwLmh0bWwpIG9uIGNvbXBsZXRpb24uXG5cbi8vIGNvbnN0IGlucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0ZXh0Jyk7XG4vLyBjb25zdCBvdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ291dHB1dCcpO1xuXG4vLyAvLyBMaXN0ZW4gZm9yIGNoYW5nZXMgbWFkZSB0byB0aGUgdGV4dGJveC5cbi8vIGlucHV0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChldmVudCkgPT4ge1xuXG4vLyAgICAgLy8gQnVuZGxlIHRoZSBpbnB1dCBkYXRhIGludG8gYSBtZXNzYWdlLlxuLy8gICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4vLyAgICAgICAgIGFjdGlvbjogJ2NsYXNzaWZ5Jyxcbi8vICAgICAgICAgdGV4dDogZXZlbnQudGFyZ2V0LnZhbHVlLFxuLy8gICAgIH1cblxuLy8gICAgIC8vIFNlbmQgdGhpcyBtZXNzYWdlIHRvIHRoZSBzZXJ2aWNlIHdvcmtlci5cbi8vICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlLCAocmVzcG9uc2UpID0+IHtcbi8vICAgICAgICAgLy8gSGFuZGxlIHJlc3VsdHMgcmV0dXJuZWQgYnkgdGhlIHNlcnZpY2Ugd29ya2VyIChgYmFja2dyb3VuZC5qc2ApIGFuZCB1cGRhdGUgdGhlIHBvcHVwJ3MgVUkuXG4vLyAgICAgICAgIG91dHB1dEVsZW1lbnQuaW5uZXJUZXh0ID0gSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UsIG51bGwsIDIpO1xuLy8gICAgIH0pO1xuLy8gfSk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=