
import { game } from 'game'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { System } from 'game/system'
import { SystemType, LevelType } from 'game/system/api'
import { Generator } from 'game/system/generator'

import { Box2 } from 'util/box'
import { Fns } from 'util/fns'
import { SeededRandom } from 'util/seeded_random'

export class CloudGenerator extends Generator implements System {

	private _rng : SeededRandom;

	constructor() {
		super(SystemType.CLOUD_GENERATOR);

		this._rng = new SeededRandom(0);
	}

	override generate(type : LevelType, seed : number) : void {
		game.entities().getMap(EntityType.CLOUD).execute((cloud : Entity) => {
			cloud.delete();
		});

		this._rng.seed(seed);

		const dir = this._rng.le(0.5) ? -1 : 1;

		const bounds = game.level().bounds();
		let x = bounds.min.x;
		while (x < bounds.max.x) {
			const length = 4 + 2 * this._rng.next();

			let z = this.zOffset(type);

			let [cloud, hasCloud] = game.entities().addEntity(EntityType.CLOUD, {
				offline: true,
				profileInit: {
					pos: {
						x: x,
						y: this.yOffset(type, bounds),
					},
					vel: {
						x: dir * (.012 + .008 * this._rng.next()),
						y: 0,
					},
					dim: {
						x: length,
						y: 0.4,
					}
				},
				modelInit: {
					transforms: {
						translate: { z: z },
					}
				}
			});

			x += length + this.spacing(type);
		}
	}

	private yOffset(type : LevelType, bounds : Box2) : number {
		if (type === LevelType.BIRD_CLIFFS) {
			return bounds.min.y + 0.5 * bounds.height() + 0.5 * this._rng.next() * bounds.height();
		}

		return bounds.min.y + this._rng.next() * bounds.height();
	}

	private zOffset(type : LevelType) : number {
		let z = 0;
		if (type === LevelType.BIRD_CLIFFS) {
			this._rng.switch([
				[0.3, () => { z = -10; }],
				[0.65, () => { z = 10; }],
				[1, () => { z = 15; }],
			]);
			return z;
		}

		this._rng.switch([
			[0.3, () => { z = 10; }],
			[0.65, () => { z = -10; }],
			[1, () => { z = -15; }],
		]);
		return z;
	}

	private spacing(type : LevelType) : number {
		if (type === LevelType.BIRD_CLIFFS) {
			return 2;
		}
		return 4;
	}
}