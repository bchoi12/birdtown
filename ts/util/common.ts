export function defined(object : any) : boolean {
    return typeof object != 'undefined' && object != null;
}

export function isDev() : boolean {
    return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}