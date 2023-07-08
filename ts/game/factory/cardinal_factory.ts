import { Cardinal, CardinalDir } from 'util/cardinal'

export enum CardinalType {
	UNKNOWN,
	OPENINGS,
}

export namespace CardinalFactory {

	export const noOpenings = new Map([
		[CardinalType.OPENINGS, Cardinal.empty()]
	]);

	export const openSides = new Map([
		[CardinalType.OPENINGS, Cardinal.fromDirs([CardinalDir.LEFT, CardinalDir.RIGHT])],
	]);

	export const openLeft = new Map([
		[CardinalType.OPENINGS, Cardinal.fromDirs([CardinalDir.LEFT])],
	]);

	export const openRight = new Map([
		[CardinalType.OPENINGS, Cardinal.fromDirs([CardinalDir.RIGHT])],
	]);

	export function generateOpenings(dirs : CardinalDir[]) {
		return new Map([
			[CardinalType.OPENINGS, Cardinal.fromDirs(dirs)],
		]);
	}

}