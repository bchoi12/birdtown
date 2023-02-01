import * as MATTER from 'matter-js'

import { game } from 'game'	
import { System, SystemBase, SystemType } from 'game/system'

export class Physics extends SystemBase implements System {

	private static readonly _maxStep : number = 10;

	private _engine : MATTER.Engine;

	constructor() {
		super(SystemType.PHYSICS);

		this._engine = MATTER.Engine.create({
			gravity: { y: 0 }
		});
	}

	world() : MATTER.Composite { return this._engine.world; }

	override physics(millis : number) : void {
		super.physics(millis);

		while(millis > 0) {
			const step = Math.max(millis, Physics._maxStep);
			MATTER.Engine.update(this._engine, step);
			millis -= step;
		}

		const entities = game.entities();
		const collisions = MATTER.Detector.collisions(this._engine.detector);
		collisions.forEach((collision) => {
			if (!collision.pair) return;

			const pair = collision.pair;
			if (!pair.bodyA || !pair.bodyA.label || !pair.bodyB || !pair.bodyB.label) {
				return;
			}

			const idA = Number(pair.bodyA.label);
			const idB = Number(pair.bodyB.label);

			if (Number.isNaN(idA) || Number.isNaN(idB)) {
				return;
			}

			if (!entities.hasEntity(idA) || !entities.hasEntity(idB)) {
				return;
			}

			const entityA = entities.getEntity(idA);
			const entityB = entities.getEntity(idB);

			if (!entityA.initialized() || !entityB.initialized()) {
				console.error("Warning: collision between uninitialized entities", entityA.name(), entityB.name());
				return;
			}

			entityA.collide(collision, entityB);

			// TODO: need to invert lots of params
			collision.normal = {x: -collision.normal.x, y: -collision.normal.y};
			entityB.collide(collision, entityA);		
		});
	}
}
		