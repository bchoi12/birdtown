
import { game } from 'game'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { System } from 'game/system'
import { SystemType } from 'game/system/api'
import { Generator } from 'game/system/generator'

import { Fns } from 'util/fns'
import { SeededRandom } from 'util/seeded_random'

export class CloudGenerator extends Generator implements System {

	private _rng : SeededRandom;

	constructor() {
		super(SystemType.CLOUD_GENERATOR);

		this._rng = new SeededRandom(0);
	}

	override generate(seed : number) : void {
		game.entities().getMap(EntityType.CLOUD).execute((cloud : Entity) => {
			cloud.delete();
		});

		this._rng.seed(seed);

		const bounds = game.level().bounds();
		let x = bounds.min.x;
		while (x < bounds.max.x) {
			const length = 4 + 2 * this._rng.next();

			const temp = this._rng.next();
			let z = 0;
			if (temp < 0.3) {
				z = 10;
			} else if (temp < 0.65) {
				z = -10;
			} else {
				z = -15;
			}

			let [cloud, hasCloud] = game.entities().addEntity(EntityType.CLOUD, {
				offline: true,
				profileInit: {
					pos: {
						x: x,
						y: bounds.min.y + this._rng.next() * bounds.height(),
					},
					vel: {
						x: .012 + .008 * this._rng.next(),
						y: 0,
					},
					dim: {
						x: 4 + 2 * this._rng.next(),
						y: 0.4,
					}
				},
				modelInit: {
					transforms: {
						translate: { z: z },
					}
				}
			});

			x += length + 4;
		}
	}
}