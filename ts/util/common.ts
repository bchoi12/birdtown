

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