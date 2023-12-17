
import { Cardinal, CardinalDir, CardinalType } from 'util/cardinal'

export type CardinalMap = Map<CardinalType, Cardinal>;

export namespace CardinalFactory {

	export function openings(dirs : CardinalDir[]) : Cardinal { return Cardinal.fromDirs(CardinalType.OPENINGS, dirs); }

	export const noOpenings : Cardinal = openings([]);
	export const openSides : Cardinal = openings([CardinalDir.LEFT, CardinalDir.RIGHT]);
	export const openLeft : Cardinal = openings([CardinalDir.LEFT]);
	export const openRight : Cardinal = openings([CardinalDir.RIGHT]);

}