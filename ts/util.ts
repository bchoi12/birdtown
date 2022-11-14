
export namespace Util {
	export function defined(object : any) : boolean {
	    return typeof object != 'undefined' && object != null;
	}
}