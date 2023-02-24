import { Cardinal, CardinalDir } from 'util/cardinal'

export enum CardinalType {
	UNKNOWN,
	OPENINGS,
}

export namespace CardinalFactory {

	export const sides = Cardinal.fromDirs([CardinalDir.LEFT, CardinalDir.RIGHT]);

	export const noOpenings = new Map([
		[CardinalType.OPENINGS, Cardinal.empty()]
	]);

	export const openSides = new Map([
		[CardinalType.OPENINGS, sides],
	]);

	export function generateOpenings() : Map<CardinalType, Cardinal> {
		return openSides;
	}

}