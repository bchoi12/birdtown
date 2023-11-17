

export namespace Fns {
	export function wrap(min : number, n : number, max : number) : number {
        const width = max - min;
        if (width > 0) {
            return min + ((((n - min) % width) + width) % width);
        }
        return n;
	}

	export function clamp(min : number, n : number, max : number) : number {
		return Math.max(min, Math.min(n, max));
	}

	export function randomRange(min : number, max : number) : number {
		return min + Math.random() * (max - min);
	}
}