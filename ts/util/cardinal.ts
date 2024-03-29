
import { DoubleMap } from 'util/double_map'

export enum CardinalType {
	UNKNOWN,
	DIRECTION,
	OPENINGS,
}

export enum CardinalDir {
	NONE,
	LEFT,
	RIGHT,
	TOP,
	BOTTOM,
	BOTTOM_LEFT,
	BOTTOM_RIGHT,
	TOP_LEFT,
	TOP_RIGHT,
}

export class Cardinal {
	private static readonly _cardinalToName = DoubleMap.fromEntries<CardinalDir, string>([
		[CardinalDir.LEFT, "left"],
		[CardinalDir.RIGHT, "right"],
		[CardinalDir.TOP, "top"],
		[CardinalDir.BOTTOM, "bottom"],
		[CardinalDir.TOP_LEFT, "topleft"],
		[CardinalDir.TOP_RIGHT, "topright"],
		[CardinalDir.BOTTOM_LEFT, "bottomleft"],
		[CardinalDir.BOTTOM_RIGHT, "bottomright"],
	]);

	private static readonly _cardinalOrder = new Array<CardinalDir>(
		CardinalDir.LEFT,
		CardinalDir.RIGHT,
		CardinalDir.TOP,
		CardinalDir.BOTTOM,
		CardinalDir.TOP_LEFT,
		CardinalDir.TOP_RIGHT,
		CardinalDir.BOTTOM_LEFT,
		CardinalDir.BOTTOM_RIGHT)

	private static readonly _allLeft = new Set<CardinalDir>([
		CardinalDir.LEFT, CardinalDir.TOP_LEFT, CardinalDir.BOTTOM_LEFT]);

	private static readonly _allRight = new Set<CardinalDir>([
		CardinalDir.RIGHT, CardinalDir.TOP_RIGHT, CardinalDir.BOTTOM_RIGHT]);

	private static readonly _allTop = new Set<CardinalDir>([
		CardinalDir.TOP, CardinalDir.TOP_LEFT, CardinalDir.TOP_RIGHT]);

	private static readonly _allBottom = new Set<CardinalDir>([
		CardinalDir.BOTTOM, CardinalDir.BOTTOM_LEFT, CardinalDir.BOTTOM_RIGHT]);

	private _type : CardinalType;
	private _cardinals : Set<CardinalDir>;

	constructor(type : CardinalType) {
		this._type = type;
		this._cardinals = new Set();
	}

	static isLeft(type : CardinalDir) : boolean { return Cardinal._allLeft.has(type); }
	static isRight(type : CardinalDir) : boolean { return Cardinal._allRight.has(type); }
	static isTop(type : CardinalDir) : boolean { return Cardinal._allTop.has(type); }
	static isBottom(type : CardinalDir) : boolean { return Cardinal._allBottom.has(type); }
	static opposite(type : CardinalDir) : CardinalDir {
		switch (type) {
		case CardinalDir.LEFT:
			return CardinalDir.RIGHT;
		case CardinalDir.RIGHT:
			return CardinalDir.LEFT;
		case CardinalDir.BOTTOM:
			return CardinalDir.TOP;
		case CardinalDir.TOP:
			return CardinalDir.BOTTOM;
		case CardinalDir.BOTTOM_LEFT:
			return CardinalDir.TOP_RIGHT;
		case CardinalDir.TOP_RIGHT:
			return CardinalDir.BOTTOM_LEFT;
		case CardinalDir.BOTTOM_RIGHT:
			return CardinalDir.TOP_LEFT;
		case CardinalDir.TOP_LEFT:
			return CardinalDir.BOTTOM_RIGHT;
		}
		return CardinalDir.NONE;
	}

	static empty(type : CardinalType) : Cardinal {
		return new Cardinal(type);
	}
	static fromDirs(type : CardinalType, dirs : CardinalDir[]) : Cardinal { 
		let cardinal = new Cardinal(type);
		dirs.forEach((dir : CardinalDir) => {
			cardinal.addDir(dir);
		});
		return cardinal;
	}

	static fromName(type : CardinalType, names : string[]) : Cardinal {
		let cardinal = new Cardinal(type);
		names.forEach((name) => {
			cardinal.addName(name);
		});
		return cardinal;
	}

	type() : CardinalType { return this._type; }
	dirs() : Set<CardinalDir> { return this._cardinals; }
	merge(other : Cardinal) : void {
		if (this.type() !== other.type()) {
			console.error("Error: skipping merge for cardinals with different types", CardinalType[this.type()], CardinalType[other.type()]);
			return;
		}

		this.addDirs(other.dirs());
	}

	empty() : boolean { return this._cardinals.size === 0; }

	addDir(type : CardinalDir) : void {
		if (Cardinal._cardinalToName.has(type)) {
			this._cardinals.add(type);
		}
	}
	addDirs(types : Set<CardinalDir>) : void {
		types.forEach((type : CardinalDir) => {
			this.addDir(type);
		});
	}

	addName(name : string) : void {
		if (!Cardinal._cardinalToName.hasReverse(name)) {
			console.error("Error: skipping invalid cardinal name", name);
			return;
		}
		this.addDir(Cardinal._cardinalToName.getReverse(name));
	}
	addNames(names : string[]) : void {
		names.forEach((name : string) => {
			this.addName(name);
		});
	}

	hasDir(type : CardinalDir) : boolean { return this._cardinals.has(type); }
	hasName(name : string) : boolean {
		if (!Cardinal._cardinalToName.hasReverse(name)) {
			return false;
		}
		return this._cardinals.has(Cardinal._cardinalToName.getReverse(name));
	}

	anyLeft() : boolean {
		return this.hasDir(CardinalDir.LEFT) || this.hasDir(CardinalDir.TOP_LEFT) || this.hasDir(CardinalDir.BOTTOM_LEFT);
	}
	anyRight() : boolean {
		return this.hasDir(CardinalDir.RIGHT) || this.hasDir(CardinalDir.TOP_RIGHT) || this.hasDir(CardinalDir.BOTTOM_RIGHT);
	}
	anyTop() : boolean {
		return this.hasDir(CardinalDir.TOP) || this.hasDir(CardinalDir.TOP_LEFT) || this.hasDir(CardinalDir.TOP_RIGHT);
	}
	anyBottom() : boolean {
		return this.hasDir(CardinalDir.BOTTOM) || this.hasDir(CardinalDir.BOTTOM_LEFT) || this.hasDir(CardinalDir.BOTTOM_RIGHT);
	}

	nameMatches(names : Set<string>) : Set<string> {
		let matches = new Set<string>();

		names.forEach((name : string) => {
			if (this.hasName(name)) {
				matches.add(name);
			}
		});
		return matches;
	}

	toBitMask() : number {
		let mask = 0;
		for (let i = 0; i < Cardinal._cardinalOrder.length; ++i) {
			if (this.hasDir(Cardinal._cardinalOrder[i])) {
				mask = mask | 0b1;
			}
			mask = (mask << 0b1);
		}
		mask = (mask >> 0b1);
		return mask;
	}

	copyBitMask(mask : number) : void {
		for (let i = Cardinal._cardinalOrder.length - 1; i >= 0; --i) {
			if ((mask & 0b1) > 0) {
				this.addDir(Cardinal._cardinalOrder[i]);
			}
			mask = (mask >> 0b1);
		}	
	}
}