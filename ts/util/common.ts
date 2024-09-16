

export function defined(...objects : any) : boolean {
    for (let i = 0; i < objects.length; ++i) {
        if (objects[i] === null || typeof objects[i] === 'undefined') {
            return false;
        }
    }
    return true;
}

export function assignOr<T extends Object>(obj : T, or : T) : T {
    return defined(obj) ? obj : or;
}

export function isLocalhost() : boolean {
    return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

export function isFirefox() : boolean {
    return navigator.userAgent.toLowerCase().includes('firefox');
}

const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
export function isMobile() : boolean {
    return mobile;
}

export function isElectron() {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` option is set to true
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }

    return false;
}