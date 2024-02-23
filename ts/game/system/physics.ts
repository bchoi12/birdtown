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
			// default = 2
			constraintIterations: 3,
			// default = 6
			positionIterations: 8,
			// default = 4
			velocityIterations: 6,
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

		this._canvas.style.width = this._minimap.offsetWidth + "px";
		this._canvas.style.height = this._minimap.offsetHeight + "px";

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