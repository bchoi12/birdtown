import * as MATTER from 'matter-js'

import { game } from 'game'	
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
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
			// default = 8
			positionIterations: 8,
			// default = 4
			velocityIterations: 4,
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

		MATTER.Events.on(this._engine.world, "afterAdd", (items) => {
			if (items.object.plugin.zIndex == 0) {
				return;
			}
		    this._engine.world.bodies.sort((a : MATTER.Body, b : MATTER.Body) => {
		        return (b.plugin.zIndex ? b.plugin.zIndex : 0) - (a.plugin.zIndex ? a.plugin.zIndex : 0);
		    });
		});
	}

	world() : MATTER.Composite { return this._engine.world; }
	queryEntity(body : MATTER.Body) : [Entity, boolean] {
		return game.entities().getEntity(Number(body.label));
	}

	override physics(stepData : StepData) : void {
		super.physics(stepData);
		const millis = stepData.millis;

		MATTER.Engine.update(this._engine, millis);

		const entities = game.entities();
		const collisions = MATTER.Detector.collisions(this._engine.detector);
		collisions.forEach((collision) => {
			if (!collision.bodyA || !collision.bodyA.label || !collision.bodyB || !collision.bodyB.label) {
				console.error("Error: pair missing body or label", collision);
				return;
			}

			const idA = collision.bodyA.label;
			const idB = collision.bodyB.label;
			const [entityA, hasEntityA] = this.queryEntity(collision.bodyA);
			const [entityB, hasEntityB] = this.queryEntity(collision.bodyB);

			if (!hasEntityA || !hasEntityB) {
				console.error("Error: skipping collision with missing entity", idA, hasEntityA, idB, hasEntityB);
				return;
			}

			if (entityA.id() === entityB.id()) {
				return;
			}

			if (entityA.deleted() || entityB.deleted()) {
				return;
			}

			if (!entityA.initialized() || !entityB.initialized()) {
				console.error("Error: skipping collision between uninitialized entities", entityA.name(), entityB.name());
				return;
			}

			if (!entityA.hasProfile() || !entityB.hasProfile()) {
				console.error("Error: one or more entities is missing a profile", entityA.name(), entityB.name());
				return;
			}

			const profileA = entityA.profile();
			const profileB = entityB.profile();

			if (profileA.body().isStatic && profileB.body().isStatic) {
				return;
			}

			entityA.collide(collision, entityB);

			// Create a partial record for the backwards collision. Only set fields are supported.
			let reverseCollision = MATTER.Collision.create(collision.bodyB, collision.bodyA);
			reverseCollision.collided = true;
			reverseCollision.normal.x = -1 * collision.normal.x;
			reverseCollision.normal.y = -1 * collision.normal.y;
			reverseCollision.penetration.x = -1 * collision.penetration.x;
			reverseCollision.penetration.y = -1 * collision.penetration.y;
			reverseCollision.tangent.x = -1 * collision.tangent.x;
			reverseCollision.tangent.y = -1 * collision.tangent.y;

			entityB.collide(reverseCollision, entityA);		
		});
	}

	override render() : void {
		super.render();

		if (!game.lakitu().validTargetEntity()) {
			this._minimap.style.visibility = "hidden";
			MATTER.Render.stop(this._render);
			return;
		}

		MATTER.Render.run(this._render);

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

		MATTER.Render.stop(this._render);
	}
}