

export namespace Strings {

	export function toTitleCase(str : string) : string {
		return str.replace(
			/\w\S*/g,
			text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase());
	}

	export function splitFirst(str : string, delim : string) : string[] {
		const index = str.indexOf(delim);
		if (index < 0) {
			return [str];
		}

		return [str.substring(0, index), str.substring(index + 1)];
	}

	export function plural(str : string, n : number) : string {
		if (n !== 1) {
			return str + "s";
		}
		return str;
	}
}