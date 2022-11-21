import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Vec2 } from 'game/common'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

type ProfileOptions = {
	readyFn : (profile : Profile) => boolean;
	bodyFn : (profile : Profile) => MATTER.Body;
	meshFn? : () => BABYLON.Mesh;
}

enum Prop {
	UNKNOWN = 0,
	POS = 1,
	VEL = 2,
	ACC = 3,
	ANGLE = 4,
}

export class Profile extends ComponentBase implements Component {

	private _readyFn : (profile : Profile) => boolean;
	private _bodyFn : (profile : Profile) => MATTER.Body;
	private _meshFn : () => BABYLON.Mesh;

	private _pos : MATTER.Vector;
	private _vel : MATTER.Vector;
	private _acc : MATTER.Vector;
	private _angle : number;
	private _body : MATTER.Body;

	// TODO: maybe separate mesh out of this component
	private _mesh : BABYLON.Mesh;

	constructor(options : ProfileOptions) {
		super(ComponentType.PROFILE);

		this._readyFn = options.readyFn;
		this._bodyFn = options.bodyFn;
		this._meshFn = options.meshFn;
	}

	override ready() : boolean {
		return this._readyFn(this);
	}
	override initialize() : void {
		super.initialize();

		this._body = this._bodyFn(this);
		MATTER.Composite.add(game.physics().world, this._body)
		this._body.label = "" + this.entity().id();

		this._mesh = this._meshFn();
	}
	override delete() : void {
		if (defined(this._mesh)) this._mesh.dispose();
		if (defined(this._body)) MATTER.World.remove(game.physics().world, this._body);
	}

	body() : MATTER.Body { return this._body; }

	hasPos() : boolean { return defined(this._pos); }
	pos() : MATTER.Vector { return MATTER.Vector.clone(this._pos); }
	setPos(vec : Vec2) : void {
		if (!this.hasPos()) { this._pos = {x: 0, y: 0}; }
		if (defined(vec.x)) { this._pos.x = vec.x; }
		if (defined(vec.y)) { this._pos.y = vec.y; }
	}
	addPos(delta : Vec2) : void {
		if (!this.hasPos()) { return; }
		if (defined(delta.x)) { this._pos.x += delta.x; }
		if (defined(delta.y)) { this._pos.y += delta.y; }
	}

	hasVel() : boolean { return defined(this._vel); }
	vel() : MATTER.Vector { return MATTER.Vector.clone(this._vel); }
	setVel(vec : Vec2) : void {
		if (!this.hasVel()) { this._vel = {x: 0, y: 0}; }
		if (defined(vec.x)) { this._vel.x = vec.x; }
		if (defined(vec.y)) { this._vel.y = vec.y; }
	}
	addVel(delta : Vec2) : void {
		if (!this.hasVel()) { return; }
		if (defined(delta.x)) { this._vel.x += delta.x; }
		if (defined(delta.y)) { this._vel.y += delta.y; }
	}

	hasAcc() : boolean { return defined(this._acc); }
	acc() : MATTER.Vector { return MATTER.Vector.clone(this._acc); }
	setAcc(vec : Vec2) : void {
		if (!this.hasAcc()) { this._acc = {x: 0, y: 0}; }
		if (defined(vec.x)) { this._acc.x = vec.x; }
		if (defined(vec.y)) { this._acc.y = vec.y; }
	}
	addAcc(delta : Vec2) : void {
		if (!this.hasAcc()) { return; }
		if (defined(delta.x)) { this._acc.x += delta.x; }
		if (defined(delta.y)) { this._acc.y += delta.y; }
	}

	hasAngle() : boolean { return defined(this._angle); }
	angle() : number { return this._angle; }
	setAngle(angle : number) : void { this._angle = angle; }
	addAngle(delta : number) : void { this._angle += delta; }

	override update(millis : number) : void {
		super.update(millis);
	}

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		if (this.hasAcc()) {
			const acc = this.acc();
			if (MATTER.Vector.magnitudeSquared(acc) > 0 && this.hasVel()) {
				const ts = millis / 1000;
				this.addVel({
					x: acc.x * ts,
					y: acc.y * ts,
				});
			}
		}

		if (this.hasVel()) {
			MATTER.Body.setVelocity(this._body, this.vel());
		}

		if (this.hasPos()) {
			MATTER.Body.setPosition(this._body, this.pos());
		}

		if (this.hasAngle()) {
			MATTER.Body.setAngle(this._body, this.angle());
		}
	}

	override postPhysics(millis : number) : void {
		super.postPhysics(millis);

		this.setVel(this._body.velocity);
		this.setPos(this._body.position);
		this.setAngle(this._body.angle);

		// TODO: move this out of here
		if (defined(this._mesh) && defined(this._body)) {
			this._mesh.position.x = this._body.position.x;
			this._mesh.position.y = this._body.position.y;
			this._mesh.rotation.z = this._body.angle;
		}
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		if (this.hasPos()) {
			this.setProp(Prop.POS, this.pos(), seqNum)
		}
		if (this.hasVel()) {
			this.setProp(Prop.VEL, this.vel(), seqNum);
		}
		if (this.hasAcc()) {
			this.setProp(Prop.ACC, this.acc(), seqNum);
		}
		if (this.hasAngle()) {
			this.setProp(Prop.ANGLE, this.angle(), seqNum);
		}
	}

	override mergeData(data : DataMap, seqNum : number) : void {
		super.mergeData(data, seqNum);

		const changed = this._data.merge(data, seqNum);

		if (changed.size === 0) {
			return;
		}

		if (changed.has(Prop.POS)) {
			this.setPos(<Vec2>this._data.get(Prop.POS));
		}
		if (changed.has(Prop.VEL)) {
			this.setVel(<Vec2>this._data.get(Prop.VEL));
		}
		if (changed.has(Prop.ACC)) {
			this.setAcc(<Vec2>this._data.get(Prop.ACC));
		}
		if (changed.has(Prop.ANGLE)) {
			this.setAngle(<number>this._data.get(Prop.ANGLE));
		}
	}
}