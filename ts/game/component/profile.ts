import * as MATTER from 'matter-js'

import { game } from 'game'
import { Vec2 } from 'game/common'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

export enum CollisionGroup {

}

export enum CollisionCategory {
	
}

type ProfileOptions = {
	readyFn? : (entity : Entity) => boolean;
	bodyFn : (entity : Entity) => MATTER.Body;
}

enum Prop {
	UNKNOWN,
	POS,
	VEL,
	ACC,
	DIM,
	ANGLE,
	INERTIA,
	SCALING,
}

export class Profile extends ComponentBase implements Component {

	public static readonly gravity = -0.85;

	private _readyFn : (entity : Entity) => boolean;
	private _bodyFn : (entity : Entity) => MATTER.Body;

	private _pos : MATTER.Vector;
	private _vel : MATTER.Vector;
	private _acc : MATTER.Vector;
	private _dim : MATTER.Vector;
	private _angle : number;
	private _applyScaling : boolean;
	private _scaleFactor : MATTER.Vector;
	private _inertia : number;
	private _scaling : MATTER.Vector;

	private _initialInertia : number;

	private _body : MATTER.Body;

	constructor(options : ProfileOptions) {
		super(ComponentType.PROFILE);

		this._readyFn = defined(options.readyFn) ? options.readyFn : () => { return true; };
		this._bodyFn = options.bodyFn;
	}

	override ready() : boolean {
		return this.hasPos() && this.hasDim() && this.hasEntity() && this._readyFn(this.entity());
	}

	override initialize() : void {
		super.initialize();

		this._body = this._bodyFn(this.entity());
		MATTER.Composite.add(game.physics().world, this._body)
		this._body.label = "" + this.entity().id();

		this._initialInertia = this._body.inertia;
	}

	override delete() : void {
		if (defined(this._body)) {
			MATTER.World.remove(game.physics().world, this._body);
		}
	}

	body() : MATTER.Body { return this._body; }

	stop() : void {
		this.setVel({x: 0, y: 0});
		this.setAcc({x: 0, y: 0});
	}

	private hasPos() : boolean { return defined(this._pos) && defined(this._pos.x, this._pos.y); }
	pos() : MATTER.Vector { return this._pos; }
	setPos(vec : Vec2) : void {
		if (!this.hasPos()) { this._pos = {x: 0, y: 0}; }
		if (defined(vec.x)) { this._pos.x = vec.x; }
		if (defined(vec.y)) { this._pos.y = vec.y; }
	}
	addPos(delta : Vec2) : void {
		if (!this.hasPos()) { this._pos = {x: 0, y: 0}; }
		if (defined(delta.x)) { this._pos.x += delta.x; }
		if (defined(delta.y)) { this._pos.y += delta.y; }
	}

	hasVel() : boolean { return defined(this._vel) && defined(this._vel.x, this._vel.y); }
	vel() : MATTER.Vector { return this._vel; }
	setVel(vec : Vec2) : void {
		if (!this.hasVel()) { this._vel = {x: 0, y: 0}; }
		if (defined(vec.x)) { this._vel.x = vec.x; }
		if (defined(vec.y)) { this._vel.y = vec.y; }
	}
	addVel(delta : Vec2) : void {
		if (!this.hasVel()) { this._vel = {x: 0, y: 0}; }
		if (defined(delta.x)) { this._vel.x += delta.x; }
		if (defined(delta.y)) { this._vel.y += delta.y; }
	}

	hasAcc() : boolean { return defined(this._acc) && defined(this._acc.x, this._acc.y); }
	acc() : MATTER.Vector { return this._acc; }
	setAcc(vec : Vec2) : void {
		if (!this.hasAcc()) { this._acc = {x: 0, y: 0}; }
		if (defined(vec.x)) { this._acc.x = vec.x; }
		if (defined(vec.y)) { this._acc.y = vec.y; }
	}
	addAcc(delta : Vec2) : void {
		if (!this.hasAcc()) { this._acc = {x: 0, y: 0}; }
		if (defined(delta.x)) { this._acc.x += delta.x; }
		if (defined(delta.y)) { this._acc.y += delta.y; }
	}

	private hasDim() : boolean { return defined(this._dim) && defined(this._dim.x, this._dim.y); }
	dim() : MATTER.Vector { return this._dim; }
	setDim(vec : Vec2) : void {
		if (Data.equals(this._dim, vec)) { return; }
		if (this.hasDim()) {
			console.error("Error: dimension is already initialized for " + this.entity().name());
			return;
		}
		this._dim = {x: 1, y: 1};
		if (defined(vec.x)) { this._dim.x = vec.x; }
		if (defined(vec.y)) { this._dim.y = vec.y; }
	}

	hasAngle() : boolean { return defined(this._angle); }
	angle() : number { return this._angle; }
	setAngle(angle : number) : void { this._angle = angle; }
	addAngle(delta : number) : void { this._angle += delta; }
	setAngularVelocity(vel : number) : void { MATTER.Body.setAngularVelocity(this._body, vel); }
	addAngularVelocity(delta : number) : void { MATTER.Body.setAngularVelocity(this._body, this._body.angularVelocity + delta); }

	hasInertia() : boolean { return defined(this._inertia); }
	inertia() : number { return this._inertia; }
	setInertia(inertia : number) : void { this._inertia = inertia; }
	resetInertia() : void { this._inertia = this._initialInertia; }

	hasScaling() : boolean { return defined(this._scaling) && defined(this._scaling.x, this._scaling.y); }
	scaling() : MATTER.Vector { return this._scaling; }
	setScaling(vec : Vec2) {
		if (!defined(this._scaling)) { this._scaling = { x: 1, y: 1}; }
		if (Data.equals(this._scaling, vec)) { return; }

		this._scaleFactor = {x: 1, y: 1};
		if (defined(vec.x)) {
			this._scaleFactor.x = vec.x / this._scaling.x;
		}
		if (defined(vec.y)) {
			this._scaleFactor.y = vec.y / this._scaling.y;
		}

		if (this._scaleFactor.x === 1 && this._scaleFactor.y === 1) {
			return;
		}

		this._applyScaling = true;
		this._scaling.x = vec.x;
		this._scaling.y = vec.y;
	}

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		if (this._applyScaling && defined(this._scaleFactor)) {
			MATTER.Body.scale(this._body, this._scaleFactor.x, this._scaleFactor.y);
			this._applyScaling = false;
		}
		if (this.hasAngle()) {
			MATTER.Body.setAngle(this._body, this.angle());
		}
		if (this.hasInertia()) {
			MATTER.Body.setInertia(this._body, this.inertia());
		}

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
		MATTER.Body.setPosition(this._body, this.pos());
	}

	override postPhysics(millis : number) : void {
		super.postPhysics(millis);

		if (!Data.equals(this._angle, this._body.angle)) {
			this.setAngle(this._body.angle);
		}
		if (!Data.equals(this._vel, this._body.velocity)) {
			let vel = this.interpolateVec(this._vel, this._body.velocity, /*limit=*/0.5, /*weight=*/0.1);
			this.setVel(vel);
		}
		let pos = this.interpolateVec(this._pos, this._body.position, /*limit=*/0.5, /*weight=*/0.1);
		this.setPos(pos);
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this.setProp(Prop.POS, MATTER.Vector.clone(this.pos()), seqNum)

		if (this.hasVel()) {
			this.setProp(Prop.VEL, MATTER.Vector.clone(this.vel()), seqNum);
		}
		if (this.hasAcc()) {
			this.setProp(Prop.ACC, MATTER.Vector.clone(this.acc()), seqNum);
		}
		if (this.hasDim()) {
			this.setProp(Prop.DIM, MATTER.Vector.clone(this.dim()), seqNum);
		}
		if (this.hasAngle()) {
			this.setProp(Prop.ANGLE, this.angle(), seqNum);
		}
		if (this.hasInertia()) {
			this.setProp(Prop.INERTIA, this.inertia(), seqNum);
		}
		if (this.hasScaling()) {
			this.setProp(Prop.SCALING, this.scaling(), seqNum);
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
		if (changed.has(Prop.DIM)) {
			this.setDim(<Vec2>this._data.get(Prop.DIM));
		}
		if (changed.has(Prop.ANGLE)) {
			this.setAngle(<number>this._data.get(Prop.ANGLE));
		}
		if (changed.has(Prop.INERTIA)) {
			this.setInertia(<number>this._data.get(Prop.INERTIA));
		}
		if (changed.has(Prop.SCALING)) {
			this.setScaling(<Vec2>this._data.get(Prop.SCALING));
		}
	}

	above(other : Profile) : boolean {
		return this.pos().y - other.pos().y - (this.dim().y / 2 + other.dim().y / 2) >= -(0.1 * this.dim().y);
	}

	interpolateVec(current : Vec2, next : Vec2, limit : number, weight : number) : Vec2 {
		if (!defined(current)) {
			return next;
		}
		if (this.isSource() || this.distanceSquared(current, next) >= limit * limit) {
			return next;
		}

		return {
			x: this.lerp(current.x, next.x, weight),
			y: this.lerp(current.y, next.y, weight),
		};
	}

	private distanceSquared(a : Vec2, b : Vec2) {
		return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
	}

	private lerp(current : number, next : number, weight : number) {
		if (!defined(current) && !defined(next)) {
			return 0;
		} else if (!defined(next)) {
			return current;
		} else if (!defined(current)) {
			return next;
		}

		return current + weight * (next - current);
	}
}