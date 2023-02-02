
import { DoubleMap } from 'util/double_map'

export enum CardinalType {
	UNKNOWN,
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
	private static readonly _cardinalToName = DoubleMap.fromEntries<CardinalType, string>([
		[CardinalType.LEFT, "left"],
		[CardinalType.RIGHT, "right"],
		[CardinalType.TOP, "top"],
		[CardinalType.BOTTOM, "bottom"],
		[CardinalType.TOP_LEFT, "topleft"],
		[CardinalType.TOP_RIGHT, "topright"],
		[CardinalType.BOTTOM_LEFT, "bottomleft"],
		[CardinalType.BOTTOM_RIGHT, "bottomright"],
	]);

	private static readonly _cardinalOrder = new Array<CardinalType>(
		CardinalType.LEFT,
		CardinalType.RIGHT,
		CardinalType.TOP,
		CardinalType.BOTTOM,
		CardinalType.BOTTOM_LEFT,
		CardinalType.BOTTOM_RIGHT,
		CardinalType.TOP_LEFT,
		CardinalType.TOP_RIGHT)

	private static readonly _allLeft = new Set<CardinalType>([
		CardinalType.LEFT, CardinalType.TOP_LEFT, CardinalType.BOTTOM_LEFT]);

	private static readonly _allRight = new Set<CardinalType>([
		CardinalType.RIGHT, CardinalType.TOP_RIGHT, CardinalType.BOTTOM_RIGHT]);

	private static readonly _allTop = new Set<CardinalType>([
		CardinalType.TOP, CardinalType.TOP_LEFT, CardinalType.TOP_RIGHT]);

	private static readonly _allBottom = new Set<CardinalType>([
		CardinalType.BOTTOM, CardinalType.BOTTOM_LEFT, CardinalType.BOTTOM_RIGHT]);

	private _cardinals : Set<CardinalType>;

	constructor() { this._cardinals = new Set(); }

	static isLeft(type : CardinalType) : boolean { return Cardinal._allLeft.has(type); }
	static isRight(type : CardinalType) : boolean { return Cardinal._allRight.has(type); }
	static isTop(type : CardinalType) : boolean { return Cardinal._allTop.has(type); }
	static isBottom(type : CardinalType) : boolean { return Cardinal._allBottom.has(type); }

	static fromTypes(types : CardinalType[]) : Cardinal { 
		let cardinal = new Cardinal();
		types.forEach((type) => {
			cardinal.addType(type);
		});
		return cardinal;
	}

	static fromName(names : string[]) : Cardinal {
		let cardinal = new Cardinal();
		names.forEach((name) => {
			cardinal.addName(name);
		});
		return cardinal;
	}

	empty() : boolean { return this._cardinals.size === 0; }

	addType(type : CardinalType) : void {
		if (Cardinal._cardinalToName.has(type)) {
			this._cardinals.add(type);
		}
	}
	addTypes(types : CardinalType[]) : void {
		types.forEach((type : CardinalType) => {
			this.addType(type);
		});
	}

	addName(name : string) : void {
		if (!Cardinal._cardinalToName.hasReverse(name)) {
			console.error("Error: skipping invalid cardinal name", name);
			return;
		}
		this.addType(Cardinal._cardinalToName.getReverse(name));
	}
	addNames(names : string[]) : void {
		names.forEach((name : string) => {
			this.addName(name);
		});
	}

	hasType(type : CardinalType) : boolean { return this._cardinals.has(type); }
	hasName(name : string) : boolean {
		if (!Cardinal._cardinalToName.hasReverse(name)) {
			return false;
		}
		return this._cardinals.has(Cardinal._cardinalToName.getReverse(name));
	}

	anyLeft() : boolean {
		return this.hasType(CardinalType.LEFT) || this.hasType(CardinalType.TOP_LEFT) || this.hasType(CardinalType.BOTTOM_LEFT);
	}
	anyRight() : boolean {
		return this.hasType(CardinalType.RIGHT) || this.hasType(CardinalType.TOP_RIGHT) || this.hasType(CardinalType.BOTTOM_RIGHT);
	}
	anyTop() : boolean {
		return this.hasType(CardinalType.TOP) || this.hasType(CardinalType.TOP_LEFT) || this.hasType(CardinalType.TOP_RIGHT);
	}
	anyBottom() : boolean {
		return this.hasType(CardinalType.BOTTOM) || this.hasType(CardinalType.BOTTOM_LEFT) || this.hasType(CardinalType.BOTTOM_RIGHT);
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
			if (this.hasType(Cardinal._cardinalOrder[i])) {
				mask = mask | 0b1;
			}
			mask << 0b1;
		}
		mask >> 0b1;
		return mask;
	}

	copyBitMask(mask : number) : void {
		for (let i = Cardinal._cardinalOrder.length - 1; i >= 0; --i) {
			if ((mask & 0b1) > 0) {
				this.addType(Cardinal._cardinalOrder[i]);
			}
			mask >> 0b1;
		}	
	}
}