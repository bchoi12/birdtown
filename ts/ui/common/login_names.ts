

export namespace LoginNames {
	const birdNames = [
		"Articuno",
		"Badtz‑Maru",
		"Big Bird",
		"Bobert Penguin",
		"Chicken Little",
		"DAAAVE",
		"Daffy",
		"Daisy",
		"Delibird",
		"Donald",
		"Duo",
		"Egghead Jr",
		"Henny Penny",
		"Herkey",
		"Iago",
		"Kevin",
		"Kowalski",
		"Moltres",
		"Mother Goose",
		"Nigel",
		"Pekkle",
		"Pidgeotto",
		"Psyduck",
		"Private",
		"Quacker",
		"Quaxly",
		"Road Runner",
		"Rowlet",
		"Scrooge",
		"Skipper",
		"Tombert Penguin",
		"Toucan Sam",
		"Tweety",
		"Woodstock",
		"Zapdos",
		"Zazu",
	];

	export function randomName() : string {
		return birdNames[Math.floor(Math.random() * birdNames.length)];
	}

	const roomLetters = "BCDFGHJKLMNPQRSTVWXYZ"

	export function randomRoom() : string {
		let room = "";
		for (let i = 0; i < 4; ++i) {
			room += roomLetters.charAt(Math.floor(Math.random() * roomLetters.length));
		}
		return room;
	}
}