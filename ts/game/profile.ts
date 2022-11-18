import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Vec2 } from 'game/common'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

interface BodyOptions {
	bodyFn? : () => MATTER.Body;
	meshFn? : () => BABYLON.Mesh;
}

export class Profile extends ComponentBase implements Component {

	private _acc : MATTER.Vector;
	private _body : MATTER.Body;

	// TODO: maybe separate mesh out of this component
	private _mesh : BABYLON.Mesh;

	constructor(options : BodyOptions) {
		super(ComponentType.PROFILE);

		this._acc = MATTER.Vector.create(0, 0);

		if (defined(options.bodyFn)) {
			this._body = options.bodyFn();
			MATTER.Composite.add(game.physics().world, this._body)
		}

		if (defined(options.meshFn)) {
			this._mesh = options.meshFn();
		}
	}

	override setEntity(entity : Entity) : void {
		super.setEntity(entity);

		if (defined(this._body)) {
			this._body.label = entity.name();
		} 
	}

	body() : MATTER.Body { return this._body; }

	pos() : MATTER.Vector { return this._body.position; }
	addPos(delta : Vec2) : void {
		MATTER.Body.setVelocity(this._body, {
			x: this.pos().x + (defined(delta.x) ? delta.x : 0),
			y: this.pos().y + (defined(delta.y) ? delta.y : 0),
		});
	}
	setPos(vec : Vec2) : void {
		MATTER.Body.setPosition(this._body, {
			x: defined(vec.x) ? vec.x : this.pos().x,
			y: defined(vec.y) ? vec.y : this.pos().y,
		});
	}

	vel() : MATTER.Vector { return this._body.velocity; }
	addVel(delta : Vec2) : void {
		MATTER.Body.setVelocity(this._body, {
			x: this.vel().x + (defined(delta.x) ? delta.x : 0),
			y: this.vel().y + (defined(delta.y) ? delta.y : 0),
		});
	}
	setVel(vec : Vec2) : void {
		MATTER.Body.setVelocity(this._body, {
			x: defined(vec.x) ? vec.x : this.vel().x,
			y: defined(vec.y) ? vec.y : this.vel().y,
		});
	}

	acc() : MATTER.Vector { return this._acc; }
	addAcc(delta : Vec2) : void {
		if (defined(delta.x)) {
			this._acc.x += delta.x;
		}
		if (defined(delta.y)) {
			this._acc.y += delta.y;
		}
	}
	setAcc(vec : Vec2) : void {
		if (defined(vec.x)) {
			this._acc.x = vec.x;
		}
		if (defined(vec.y)) {
			this._acc.y = vec.y;
		}
	}

	override update(millis : number) : void {
		if (MATTER.Vector.magnitudeSquared(this._acc) > 0) {
			const ts = millis / 1000;
			this.addVel({
				x: this._acc.x * ts,
				y: this._acc.y * ts,
			});
		}
	}

	override postPhysics(millis : number) : void {
		// TODO: move this out of here
		if (defined(this._mesh) && defined(this._body)) {
			this._mesh.position.x = this._body.position.x;
			this._mesh.position.y = this._body.position.y;
			this._mesh.rotation.z = this._body.angle;
		}
	}
}