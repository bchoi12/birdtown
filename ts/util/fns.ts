
export enum InterpType {
	UNKNOWN,

	LINEAR,
	SQUARE,
	CUBIC,
	NEGATIVE_SQUARE,
	PAUSE_THEN_REALLY_EASE_IN,
	REALLY_EASE_IN,
	SUDDEN_END_70
}

// Should go from (0, 0) to (1, 1)
export type InterpFn = (t : number) => number;

export namespace Fns {
	export function roundUp(n : number, int : number) {
		return Number.isNaN(n) ? 0.0 : int * Math.ceil(n / int);
	}
	export function roundTo(n : number, int : number) {
		return Number.isNaN(n) ? 0.0 : int * Math.round(n / int);
	}

	export function wrap(min : number, n : number, max : number) : number {
        const width = max - min;
        if (width > 0) {
            return min + ((((n - min) % width) + width) % width);
        }
        return n;
	}

	// [0, 2pi)
	export function normalizeRad(rad : number) : number {
		return rad - 2 * Math.PI * Math.floor(rad / (2 * Math.PI));
	}

	// [-pi, pi)
	export function minimizeRad(rad : number) : number {
		return normalizeRad(rad + Math.PI) - Math.PI;
	}
	// [0, 360)
	export function normalizeDeg(deg : number) : number {
		return deg - 360 * Math.floor(deg / 360);
	}

	export function clamp(min : number, n : number, max : number) : number {
		return Math.max(min, Math.min(n, max));
	}

	// Make 0-1
	export function  normalizeRange(min : number, n : number, max : number) : number {
		return clamp(0, (n - min) / (max - min), 1);
	}

	export function lerpRange(min : number, weight : number, max : number) : number {
		return min + weight * (max - min);
	}

	export function randomNoise(n : number) : number{
		return -n + Math.random() * 2 * n;
	}

	export function randomRange(min : number, max : number) : number {
		return min + Math.random() * (max - min);
	}

	// Inclusive
	export function randomInt(min : number, max : number) : number {
		return min + Math.floor(Math.random() * (max - min + 1));
	}

	export const interpFns = new Map<InterpType, InterpFn>([
		[InterpType.LINEAR, (t : number) => { return t; }],
		[InterpType.SQUARE, (t : number) => { return t * t; }],
		[InterpType.CUBIC, (t : number) => { return t * t * t; }],
		[InterpType.NEGATIVE_SQUARE, (t : number) => { return t * (2 - t); }],
		[InterpType.REALLY_EASE_IN, (t : number) => { return (t - 1) * (t - 1) * (t - 1) * (1 - t) + 1; }],
		[InterpType.PAUSE_THEN_REALLY_EASE_IN, (t : number) => {
			let x = (t - 0.3) / 0.7;
			return t < 0.3 ? 0 : (x - 1) * (x - 1) * (x - 1) * (1 - x) + 1; 
		}],
		[InterpType.SUDDEN_END_70, (t : number) => { return t < 0.7 ? 0 : (t - 0.7) / 0.3 }],
	]);

	export function interp(type : InterpType, n : number) : number { return interpFns.get(type)(n); }
}