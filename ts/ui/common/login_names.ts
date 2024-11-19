
import { ColorType } from 'game/factory/api'

export namespace LoginNames {
	const birdNames = new Array<[string, ColorType]>(
		["ANGRY BIRD", ColorType.PLAYER_PURPLE],
		["Articuno", ColorType.PLAYER_AQUA],
		["Azir", ColorType.PLAYER_GOLD],
		["Badtz‑Maru", ColorType.PLAYER_BLACK],
		["Big Bird", ColorType.PLAYER_YELLOW],
		["Blathers", ColorType.PLAYER_BROWN],
		["Bobert Penguin", ColorType.PLAYER_GRAY],
		["Bonchon", ColorType.PLAYER_RED],
		["Brewster", ColorType.PLAYER_GREEN],
		["Chaunticleer", ColorType.PLAYER_GRAY],
		["Chicken Little", ColorType.PLAYER_YELLOW],
		["DAAAVE", ColorType.PLAYER_RED],
		["Daffy", ColorType.PLAYER_BLACK],
		["Daisy", ColorType.PLAYER_PINK],
		["Delibird", ColorType.PLAYER_WHITE],
		["Donald", ColorType.PLAYER_AQUA],
		["Duck Dodgers", ColorType.PLAYER_LIME],
		["Duo", ColorType.PLAYER_LIME],
		["Egghead Jr", ColorType.PLAYER_RED],
		["Falco", ColorType.PLAYER_BLUE],
		["Farfetch'd", ColorType.PLAYER_GREEN],
		["Feng Zhua", ColorType.PLAYER_BROWN],
		["FLAMINGO", ColorType.PLAYER_PINK],
		["Heihei", ColorType.PLAYER_TEAL],
		["Henny Penny", ColorType.PLAYER_YELLOW],
		["Henry Tobasco", ColorType.PLAYER_RED],
		["Herkey", ColorType.PLAYER_GOLD],
		["Ho-oh", ColorType.PLAYER_RED],
		["Iago", ColorType.PLAYER_RED],
		["José Carioca", ColorType.PLAYER_LIME],
		["King Dedede", ColorType.PLAYER_RED],
		["Kowalski", ColorType.PLAYER_ORANGE],
		["Lugia", ColorType.PLAYER_PURPLE],
		["Moltres", ColorType.PLAYER_RED],
		["Mother Goose", ColorType.PLAYER_WHITE],
		["Pekkle", ColorType.PLAYER_AQUA],
		["Pidgeotto", ColorType.PLAYER_ORANGE],
		["Piplup", ColorType.PLAYER_AQUA],
		["Psyduck", ColorType.PLAYER_GOLD],
		["Private", ColorType.PLAYER_WHITE],
		["Quacker", ColorType.PLAYER_GOLD],
		["Quaxly", ColorType.PLAYER_AQUA],
		["Road Runner", ColorType.PLAYER_BLUE],
		["Roald", ColorType.PLAYER_ORANGE],
		["Rowlet", ColorType.PLAYER_BROWN],
		["Scrooge", ColorType.PLAYER_WHITE],
		["Skipper", ColorType.PLAYER_BLACK],
		["Starbird", ColorType.PLAYER_GOLD],
		["Tombert Penguin", ColorType.PLAYER_AQUA],
		["Toucan Sam", ColorType.PLAYER_ORANGE],
		["Tweety", ColorType.PLAYER_YELLOW],
		["Twitter", ColorType.PLAYER_AQUA],
		["Woodstock", ColorType.PLAYER_YELLOW],
		["Wrastor", ColorType.PLAYER_PURPLE],
		["Zapdos", ColorType.PLAYER_YELLOW],
		["Zazu", ColorType.PLAYER_BLUE],
	);

	export function randomName() : string {
		return randomNameAndColor()[0];
	}

	export function randomNameAndColor() : [string, ColorType] {
		return birdNames[Math.floor(Math.random() * birdNames.length)];
	}

	const roomLetters = "BCDFGHJKLMNPQRTVWXY346789"

	export function randomRoom() : string {
		let room = "";
		for (let i = 0; i < 4; ++i) {
			room += roomLetters.charAt(Math.floor(Math.random() * roomLetters.length));
		}
		return room;
	}
}