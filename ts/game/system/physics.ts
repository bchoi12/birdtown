import * as MATTER from 'matter-js'

import { game } from 'game'	
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { Html } from 'ui/html'

import { Vec2 } from 'util/vector'

export class Physics extends SystemBase implements System {

	private _engine : MATTER.Engine;
	private _minimap : HTMLElement;
	private _canvas : HTMLCanvasElement;
	private _render : MATTER.Render;
	private _lastRender : number;

	constructor() {
		super(SystemType.PHYSICS);

		this._engine = MATTER.Engine.create({
			gravity: { y: 0 },
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

		this.updateIterations();

		MATTER.Render.run(this._render);
		this._canvas.style.width = Html.elm(Html.divMinimap).offsetWidth + "px";
		this._canvas.style.height = Html.elm(Html.divMinimap).offsetHeight + "px";
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.RUNNER_SPEED) {
			return;
		}

		if (msg.hasGameSpeed()) {
			this.updateIterations();
		}
	}

	private updateIterations() : void {
		const stepTime = game.runner().targetStepTime();
		this._engine.constraintIterations = Math.ceil(stepTime / 4);
		this._engine.positionIterations = Math.ceil(stepTime / 3);
		this._engine.velocityIterations = Math.ceil(stepTime / 4);
	}

	world() : MATTER.Composite { return this._engine.world; }

	override physics(stepData : StepData) : void {
		super.physics(stepData);
		const millis = stepData.millis;

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

			if (!entityA.hasProfile() || !entityB.hasProfile()) {
				return;
			}

			const profileA = entityA.profile();
			const profileB = entityB.profile();

			if (profileA.body().isStatic && profileB.body().isStatic) {
				return;
			}

			// Ignore "pixel collisions"
			let normal = Vec2.fromVec(collision.normal);
			let pen = Vec2.fromVec(collision.penetration);
			if (profileB.body().isStatic) {
				// Find overlap of rectangle bounding boxes.
				let overlap = profileA.pos().clone().sub(profileB.pos()).abs();
				overlap.sub({
					x: profileA.scaledDim().x / 2 + profileB.scaledDim().x / 2,
					y: profileA.scaledDim().y / 2 + profileB.scaledDim().y / 2,
				});

				// Calculate relative vel to determine collision direction
				let vel = profileA.vel();
				const xCollision = Math.abs(overlap.x * vel.y) < Math.abs(overlap.y * vel.x);
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