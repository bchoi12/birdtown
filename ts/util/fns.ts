

export namespace Fns {
	export function clamp(min : number, n : number, max : number) : number {
		return Math.max(min, Math.min(n, max));
	}
}