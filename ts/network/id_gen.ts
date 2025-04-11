

export namespace IdGen {
	// Don't include anything that is or looks like a vowel
	// Try not to include any ambiguous looking things either
	const roomLetters = "BCDFGHJKLMNPQRTVWXY6789"

	export function randomId(n : number) : string {
		let room = "";
		for (let i = 0; i < n; ++i) {
			room += roomLetters.charAt(Math.floor(Math.random() * roomLetters.length));
		}
		return room;
	}
}