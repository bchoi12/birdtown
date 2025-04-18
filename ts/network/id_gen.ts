

export namespace IdGen {
	// Don't include anything that is or looks like a vowel
	// Try not to include any ambiguous looking things either
	const validChars = "BCDFGHJKLMNPQRTVWXY6789"

	export function randomId(n : number) : string {
		let id = "";
		for (let i = 0; i < n; ++i) {
			id += validChars.charAt(Math.floor(Math.random() * validChars.length));
		}
		return id;
	}

	const numbers = "0123456789";
	export function randomNum(n : number) : string {
		let num = "";
		for (let i = 0; i < n; ++i) {
			num += numbers.charAt(Math.floor(Math.random() * numbers.length));
		}
		return num;
	}
}