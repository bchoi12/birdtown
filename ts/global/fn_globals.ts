
export enum InterpType {
	UNKNOWN,

	LINEAR,
	SQUARE,
	CUBIC,
	NEGATIVE_SQUARE,
	SUDDEN_END_70
}

// Should go from (0, 0) to (1, 1)
export type InterpFn = (t : number) => number;

export namespace FnGlobals {
	export const interpFns = new Map<InterpType, InterpFn>([
		[InterpType.LINEAR, (t : number) => { return t; }],
		[InterpType.SQUARE, (t : number) => { return t * t; }],
		[InterpType.CUBIC, (t : number) => { return t * t * t; }],
		[InterpType.NEGATIVE_SQUARE, (t : number) => { return t * (2 - t); }],
		[InterpType.SUDDEN_END_70, (t : number) => { return t < 0.7 ? 0 : (t - 0.7) / 0.3 }],
	]);

	export function interp(type : InterpType, n : number) : number { return interpFns.get(type)(n); }
}