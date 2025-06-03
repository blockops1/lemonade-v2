export function documentReadyPromise(creator) {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve(creator());
        }
        else {
            window.addEventListener('load', () => resolve(creator()));
        }
    });
}
