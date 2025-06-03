"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentReadyPromise = documentReadyPromise;
function documentReadyPromise(creator) {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve(creator());
        }
        else {
            window.addEventListener('load', () => resolve(creator()));
        }
    });
}
