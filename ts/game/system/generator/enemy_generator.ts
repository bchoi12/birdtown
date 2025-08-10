
import { game } from 'game'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { System } from 'game/system'
import { SystemType, LevelType, LevelLayout } from 'game/system/api'
import { Generator } from 'game/system/generator'

import { Box2 } from 'util/box'
import { Fns } from 'util/fns'
import { SeededRandom } from 'util/seeded_random'

export class EnemyGenerator extends Generator implements System {

	private _rng : SeededRandom;

	constructor() {
		super(SystemType.ENEMY_GENERATOR);

		this._rng = new SeededRandom(0);
	}

	override cleanUp(type : LevelType, layout : LevelLayout) : void {
	}

	override generate(type : LevelType, layout : LevelLayout, seed : number) : void {
		this._rng.seed(seed);
	}
}