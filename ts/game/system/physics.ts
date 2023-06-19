import * as MATTER from 'matter-js'

import { game } from 'game'	
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { Html } from 'ui/html'

import { Vec2 } from 'util/vector'

export class Physics extends SystemBase implements System {

	private static readonly _renderInterval = 250;

	private _engine : MATTER.Engine;
	private _canvas : HTMLCanvasElement;
	private _render : MATTER.Render;
	private _lastRender : number;

	constructor() {
		super(SystemType.PHYSICS);

		this._engine = MATTER.Engine.create({
			gravity: { y: 0 }
		});

		this._canvas = Html.canvasElm(Html.canvasPhysics);
		this._render = MATTER.Render.create({
			canvas: this._canvas,
			engine: this._engine,
			options: {
				background: "transparent",
				hasBounds: true,
				wireframes: false,
			},
		});
		this._lastRender = Date.now();
	}

	override initialize() : void {
		super.initialize();

		MATTER.Render.run(this._render);
		this._canvas.style.width = Html.elm(Html.divMinimap).offsetWidth + "px";
		this._canvas.style.height = Html.elm(Html.divMinimap).offsetHeight + "px";
	}

	world() : MATTER.Composite { return this._engine.world; }

	override physics(millis : number) : void {
		super.physics(millis);

		MATTER.Engine.update(this._engine, millis);

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

			const [entityA, hasEntityA] = entities.getEntity(idA);
			const [entityB, hasEntityB] = entities.getEntity(idB);

			if (!hasEntityA || !hasEntityB) {
				console.error("Error: skipping collision with missing entity", idA, hasEntityA, idB, hasEntityB);
				return;
			}

			if (!entityA.initialized() || !entityB.initialized()) {
				console.error("Error: skipping collision between uninitialized entities", entityA.name(), entityB.name());
				return;
			}

			if (entityA.deleted() || entityB.deleted()) {
				return;
			}

			if (entityA.id() === entityB.id()) {
				return;
			}

			if (!entityA.hasComponent(ComponentType.PROFILE) || !entityB.hasComponent(ComponentType.PROFILE)) {
				return;
			}

			const profileA = entityA.getComponent<Profile>(ComponentType.PROFILE);
			const profileB = entityB.getComponent<Profile>(ComponentType.PROFILE);

			// Smooth out normals that are nearly axis-aligned
			// Ignore "pixel collisions"
			let normal = Vec2.fromVec(collision.normal);
			let pen = Vec2.fromVec(collision.penetration);
			if (Math.abs(normal.x) > 0.99 || Math.abs(normal.y) > 0.99) {
				// Find overlap of rectangle bounding boxes.
				let overlap = profileA.pos().clone().sub(profileB.pos()).abs();
				overlap.sub({
					x: profileA.dim().x / 2 + profileB.dim().x / 2,
					y: profileA.dim().y / 2 + profileB.dim().y / 2,
				});
				overlap.negate();

				// Calculate relative vel to determine collision direction
				let relativeVel = profileA.vel().clone().sub(profileB.vel());
				const xCollision = Math.abs(overlap.x * relativeVel.y) < Math.abs(overlap.y * relativeVel.x);
				if (xCollision) {
					// Either overlap in other dimension is too small or collision direction is in disagreement.
					if (Math.abs(overlap.y) < 1e-2 || Math.abs(normal.y) > 0.99) {
						pen.scale(0);
					}
					pen.y = 0;
					normal.x = Math.sign(normal.x);
					normal.y = 0;
				} else {
					if (Math.abs(overlap.x) < 1e-2 || Math.abs(normal.x) > 0.99) {
						pen.scale(0);
					}
					pen.x = 0;
					normal.x = 0;
					normal.y = Math.sign(normal.y);
				}
			}
			collision.normal.x = normal.x;
			collision.normal.y = normal.y;
			collision.penetration.x = pen.x;
			collision.penetration.y = pen.y;

			entityA.collide(collision, entityB);
			collision.normal.x *= -1;
			collision.normal.y *= -1;
			collision.penetration.x *= -1;
			collision.penetration.y *= -1;
			entityB.collide(collision, entityA);		
		});
	}

	override render(millis : number) : void {
		super.render(millis);

		if (!game.lakitu().hasTargetEntity()) {
			return;
		}

		const target = game.lakitu().target();
		MATTER.Render.lookAt(this._render, {
			min: {x: target.x - 12.5, y: target.y - 7.5 },
			max: {x: target.x + 12.5, y: target.y + 7.5 },
		})
		this._render.bounds.min.x = target.x - 12.5;
		this._render.bounds.max.x = target.x + 12.5; 
	}
}
		