
import { CardinalType } from 'game/factory/api'

import { Cardinal, CardinalDir } from 'util/cardinal'

export type CardinalMap = Map<CardinalType, Cardinal>;

export namespace CardinalFactory {

	export const noOpenings : CardinalMap = new Map([
		[CardinalType.OPENINGS, Cardinal.empty()]
	]);

	export const openSides : CardinalMap = new Map([
		[CardinalType.OPENINGS, Cardinal.fromDirs([CardinalDir.LEFT, CardinalDir.RIGHT])],
	]);

	export const openLeft : CardinalMap = new Map([
		[CardinalType.OPENINGS, Cardinal.fromDirs([CardinalDir.LEFT])],
	]);

	export const openRight : CardinalMap = new Map([
		[CardinalType.OPENINGS, Cardinal.fromDirs([CardinalDir.RIGHT])],
	]);

	export function generateOpenings(dirs : CardinalDir[]) : CardinalMap {
		return new Map([
			[CardinalType.OPENINGS, Cardinal.fromDirs(dirs)],
		]);
	}

}