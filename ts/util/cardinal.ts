
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

	private static readonly _allLeft = new Set<CardinalType>([
		CardinalType.LEFT, CardinalType.TOP_LEFT, CardinalType.BOTTOM_LEFT]);

	private static readonly _allRight = new Set<CardinalType>([
		CardinalType.RIGHT, CardinalType.TOP_RIGHT, CardinalType.BOTTOM_RIGHT]);

	private static readonly _allTop = new Set<CardinalType>([
		CardinalType.TOP, CardinalType.TOP_LEFT, CardinalType.TOP_RIGHT]);

	private static readonly _allBottom = new Set<CardinalType>([
		CardinalType.BOTTOM, CardinalType.BOTTOM_LEFT, CardinalType.BOTTOM_RIGHT]);

	private _cardinals : Set<CardinalType>;

	private constructor() { this._cardinals = new Set(); }

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

	addType(type : CardinalType) : void { this._cardinals.add(type); }
	addName(name : string) : void {
		if (!Cardinal._cardinalToName.hasReverse(name)) {
			console.error("Error: skipping invalid cardinal name", name);
			return;
		}
		this.addType(Cardinal._cardinalToName.getReverse(name));
	}

	anyLeft() : boolean {
		this._cardinals.forEach((type) => {
			if (Cardinal._allLeft.has(type)) {
				return true;
			}
		});
		return false;
	}

	anyRight() : boolean {
		this._cardinals.forEach((type) => {
			if (Cardinal._allRight.has(type)) {
				return true;
			}
		});
		return false;
	}

	anyTop() : boolean {
		this._cardinals.forEach((type) => {
			if (Cardinal._allTop.has(type)) {
				return true;
			}
		});
		return false;
	}

	anyBottom() : boolean {
		this._cardinals.forEach((type) => {
			if (Cardinal._allBottom.has(type)) {
				return true;
			}
		});
		return false;
	}
}