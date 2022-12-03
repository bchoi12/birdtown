export function defined(...objects : any) : boolean {
    for (let i = 0; i < objects.length; ++i) {
        if (typeof objects[i] === 'undefined' || objects[i] === null) {
            return false;
        }
    }
    return true;
}

export function isLocalhost() : boolean {
    return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}