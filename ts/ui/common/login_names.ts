
import { ColorType } from 'game/factory/api'

export namespace LoginNames {
	const birdNames = new Array<[string, ColorType]>(
		["ANGRY BIRD", ColorType.PLAYER_PURPLE],
		["Articuno", ColorType.PLAYER_AQUA],
		["Badtz‑Maru", ColorType.PLAYER_BLACK],
		["Big Bird", ColorType.PLAYER_YELLOW],
		["Bobert Penguin", ColorType.PLAYER_GRAY],
		["Chicken Little", ColorType.PLAYER_YELLOW],
		["DAAAVE", ColorType.PLAYER_RED],
		["Daffy", ColorType.PLAYER_BLACK],
		["Daisy", ColorType.PLAYER_PINK],
		["Delibird", ColorType.PLAYER_WHITE],
		["Donald", ColorType.PLAYER_BLUE],
		["Duo", ColorType.PLAYER_GREEN],
		["Egghead Jr", ColorType.PLAYER_RED],
		["FLAMINGO", ColorType.PLAYER_PINK],
		["Henny Penny", ColorType.PLAYER_YELLOW],
		["Henry Tobasco", ColorType.PLAYER_RED],
		["Herkey", ColorType.PLAYER_ORANGE],
		["Ho-oh", ColorType.PLAYER_RED],
		["Iago", ColorType.PLAYER_RED],
		["Kevin", ColorType.PLAYER_BLUE],
		["Kowalski", ColorType.PLAYER_ORANGE],
		["Lugia", ColorType.PLAYER_PURPLE],
		["Moltres", ColorType.PLAYER_RED],
		["Mother Goose", ColorType.PLAYER_WHITE],
		["Nigel", ColorType.PLAYER_GRAY],
		["Pekkle", ColorType.PLAYER_AQUA],
		["Pidgeotto", ColorType.PLAYER_ORANGE],
		["Psyduck", ColorType.PLAYER_YELLOW],
		["Private", ColorType.PLAYER_WHITE],
		["Quacker", ColorType.PLAYER_YELLOW],
		["Quaxly", ColorType.PLAYER_AQUA],
		["Road Runner", ColorType.PLAYER_BLUE],
		["Rowlet", ColorType.PLAYER_GREEN],
		["Scrooge", ColorType.PLAYER_BLUE],
		["Skipper", ColorType.PLAYER_BLACK],
		["Tombert Penguin", ColorType.PLAYER_AQUA],
		["Toucan Sam", ColorType.PLAYER_ORANGE],
		["Tweety", ColorType.PLAYER_YELLOW],
		["Woodstock", ColorType.UNKNOWN],
		["Zapdos", ColorType.PLAYER_YELLOW],
		["Zazu", ColorType.PLAYER_BLUE],
	);

	export function randomName() : string {
		return randomNameAndColor()[0];
	}

	export function randomNameAndColor() : [string, ColorType] {
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