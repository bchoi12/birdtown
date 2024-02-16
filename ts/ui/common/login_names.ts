

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
		"Kevin",
		"Iago",
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
		"Toucan Sam",
		"Tweety",
		"Woodstock",
		"Zapdos",
		"Zazu",
	];

	export function randomName() : string {
		return birdNames[Math.floor(Math.random() * birdNames.length)];
	}
}