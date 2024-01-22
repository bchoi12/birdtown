

export namespace LoginNames {
	const birdNames = [
		"Articuno",
		"Badtz‑Maru",
		"Big Bird",
		"Bobert Penguin",
		"Chicken Little",
		"Daffy",
		"Daisy",
		"DAAAVE",
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
		"Pekkle",
		"Pidgeotto",
		"Psyduck",
		"Private",
		"Quacker",
		"Rico",
		"Road Runner",
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