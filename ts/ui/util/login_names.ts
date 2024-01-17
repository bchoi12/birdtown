

export namespace LoginNames {
	const birdNames = [
		"Arcticuno",
		"Badtz‑Maru",
		"Big Bird",
		"Bobert Penguin",
		"Chicken Little",
		"Daffy",
		"Daisy",
		"DAAAVE",
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