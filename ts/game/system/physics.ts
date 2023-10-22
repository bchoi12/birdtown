import * as MATTER from 'matter-js'

import { game } from 'game'	
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { Html } from 'ui/html'

import { Vec2 } from 'util/vector'

export class Physics extends SystemBase implements System {

	private static readonly _maxUpdateTime : number = 10;
	private static readonly _renderInterval : number = 250;

	private _engine : MATTER.Engine;
	private _minimap : HTMLElement;
	private _canvas : HTMLCanvasElement;
	private _render : MATTER.Render;
	private _lastRender : number;

	constructor() {
		super(SystemType.PHYSICS);

		this._engine = MATTER.Engine.create({
			gravity: { y: 0 }
		});

		this._minimap = Html.elm(Html.divMinimap);
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

	override physics(stepData : StepData) : void {
		super.physics(stepData);
		const millis = stepData.millis;

		let update = millis;
		while (update > 0) {
			const step = Math.min(Physics._maxUpdateTime, update);
			MATTER.Engine.update(this._engine, step);
			update -= step;
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

			if (!entityA.hasProfile() || !entityB.hasProfile()) {
				return;
			}

			const profileA = entityA.getProfile();
			const profileB = entityB.getProfile();

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

	override render() : void {
		super.render();

		if (!game.lakitu().hasTargetEntity()) {
			this._minimap.style.visibility = "hidden";
			return;
		}
		this._minimap.style.visibility = "visible";

		const target = game.lakitu().target();
		const fov = game.lakitu().fov();
		MATTER.Render.lookAt(this._render, {
			min: {x: target.x - fov.x / 2, y: target.y - fov.y / 2 },
			max: {x: target.x + fov.x / 2, y: target.y + fov.y / 2 },
		})
		this._render.bounds.min.x = target.x - fov.x / 2;
		this._render.bounds.max.x = target.x + fov.x / 2; 
	}
}
		