import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { ProfilePart } from 'game/component/profile_part'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity, EntityOptions } from 'game/entity'

import { options } from 'options'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

export type ProfileInitOptions = {
	pos? : Vec;
	vel? : Vec;
	acc? : Vec;
	dim? : Vec;
}

type ReadyFn = (profile : Profile) => boolean;
type InitFn = (profile : Profile) => void;
type OnInitFn = (profile : Profile) => void;

type ProfileOptions = {
	readyFn? : ReadyFn;
	initFn : InitFn;
	initOptions? : ProfileInitOptions;
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
	private _readyFn : ReadyFn;
	private _initFn : InitFn;

	private _pos : Vec2;
	private _vel : Vec2;
	private _acc : Vec2;
	private _dim : Vec2;
	private _angle : number;
	private _applyScaling : boolean;
	private _scaleFactor : Vec2;
	private _inertia : number;
	private _scaling : Vec2;

	private _forces : Array<Vec>;
	private _initialInertia : number;

	private _composite : MATTER.Composite;
	private _body : MATTER.Body;

	constructor(options : ProfileOptions) {
		super(ComponentType.PROFILE);

		this._readyFn = defined(options.readyFn) ? options.readyFn : (profile : Profile) => { return true; };
		this._initFn = options.initFn;

		if (options.initOptions) {
			this.initFromOptions(options.initOptions);
		}
	}

	initFromOptions(options : ProfileInitOptions) : void {
		if (options.pos) { this.setPos(options.pos); }
		if (options.vel) { this.setVel(options.vel); }
		if (options.acc) { this.setAcc(options.acc); }
		if (options.dim) { this.setDim(options.dim); }
	}

	override ready() : boolean {
		return this.hasPos() && this.hasDim() && this._readyFn(this);
	}

	override initialize() : void {
		super.initialize();

		this._initFn(this);
		MATTER.Composite.add(game.physics().world, this._body)
		this._body.label = "" + this.entity().id();
		this._body.parts.forEach((body : MATTER.Body) => {
			body.label = "" + this.entity().id();
		})

		this._forces = new Array();
		this._initialInertia = this._body.inertia;
	}

	override dispose() : void {
		super.dispose();

		if (defined(this._body)) {
			MATTER.World.remove(game.physics().world, this._body);
		}
	}

	hasBody() : boolean { return defined(this._body); }
	setBody(body : MATTER.Body) : void { this._body = body; }
	body() : MATTER.Body { return this._body; }

	stop() : void {
		this.setVel({x: 0, y: 0});
		this.setAcc({x: 0, y: 0});
	}

	private hasPos() : boolean { return defined(this._pos) && defined(this._pos.x, this._pos.y); }
	pos() : Vec2 { return this._pos; }
	setPos(vec : Vec) : void {
		if (!this.hasPos()) { this._pos = Vec2.zero(); }

		this._pos.copyVec(vec);
	}
	addPos(delta : Vec) : void {
		if (!this.hasPos()) { this._pos = Vec2.zero(); }

		this._pos.add(delta);
	}

	hasVel() : boolean { return defined(this._vel) && defined(this._vel.x, this._vel.y); }
	vel() : Vec2 { return this._vel; }
	setVel(vec : Vec) : void {
		if (!this.hasVel()) { this._vel = Vec2.zero(); }

		this._vel.copyVec(vec);
	}
	addVel(delta : Vec) : void {
		if (!this.hasVel()) { this._vel = Vec2.zero(); }

		this._vel.add(delta);
	}

	hasAcc() : boolean { return defined(this._acc) && defined(this._acc.x, this._acc.y); }
	acc() : Vec2 { return this._acc; }
	setAcc(vec : Vec) : void {
		if (!this.hasAcc()) { this._acc = Vec2.zero(); }

		this._acc.copyVec(vec);
	}
	addAcc(delta : Vec) : void {
		if (!this.hasAcc()) { this._acc = Vec2.zero(); }

		this._acc.add(delta);
	}

	private hasDim() : boolean { return defined(this._dim) && defined(this._dim.x, this._dim.y); }
	dim() : Vec2 { return this._dim; }
	setDim(vec : Vec) : void {
		if (defined(this._dim) && Data.equals(this._dim.toVec(), vec)) { return; }
		if (this.hasDim()) {
			console.error("Error: dimension is already initialized for " + name);
			return;
		}
		this._dim = Vec2.fromVec(vec);
	}

	hasAngle() : boolean { return defined(this._angle); }
	angle() : number { return this._angle; }
	setAngle(angle : number) : void { this._angle = angle; }
	addAngle(delta : number) : void { this._angle += delta; }
	setAngularVelocity(vel : number) : void { MATTER.Body.setAngularVelocity(this._body, vel); }
	addAngularVelocity(delta : number) : void { MATTER.Body.setAngularVelocity(this._body, this._body.angularVelocity + delta); }

	addForce(force : Vec) : void { this._forces.push(force); }
	private applyForces() : void {
		if (this._forces.length === 0) {
			return;
		}

		let totalForce = Vec2.zero();
		this._forces.forEach((force : Vec) => {
			totalForce.add(force);
		});

		this.addVel(totalForce);
		this._forces = [];
	}

	hasInertia() : boolean { return defined(this._inertia); }
	inertia() : number { return this._inertia; }
	setInertia(inertia : number) : void { this._inertia = inertia; }
	resetInertia() : void { this._inertia = this._initialInertia; }

	hasScaling() : boolean { return defined(this._scaling) && defined(this._scaling.x, this._scaling.y); }
	scaling() : Vec2 { return this._scaling; }
	setScaling(vec : Vec) {
		if (!defined(this._scaling)) {
			this._scaling = Vec2.fromVec({x: 1, y: 1});
		}
		if (!defined(this._scaleFactor)) {
			this._scaleFactor = Vec2.fromVec({x: 1, y: 1});
		}

		if (Data.equals(this._scaling, vec)) { return; }

		if (defined(vec.x)) {
			this._scaleFactor.x = vec.x / this._scaling.x;
		}
		if (defined(vec.y)) {
			this._scaleFactor.y = vec.y / this._scaling.y;
		}

		if (Data.equals(this._scaleFactor.x, 1) && Data.equals(this._scaleFactor.y, 1)) {
			return;
		}

		this._applyScaling = true;
		this._scaling.copyVec(vec);
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
			if (acc.lengthSq() > 0 && this.hasVel()) {
				const ts = millis / 1000;
				this.addVel({
					x: acc.x * ts,
					y: acc.y * ts,
				});
			}
		}

		this.applyForces();

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
			this.setVel(this._body.velocity);
		}

		this._pos.x = this.lerp(this._pos.x, this._body.position.x, options.predictionWeight);
		this._pos.y = this.lerp(this._pos.y, this._body.position.y, /*weight=*/0);
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this.setProp(Prop.POS, this.pos().toVec(), seqNum)

		if (this.hasVel()) {
			this.setProp(Prop.VEL, this.vel().toVec(), seqNum);
		}
		if (this.hasAcc()) {
			this.setProp(Prop.ACC, this.acc().toVec(), seqNum);
		}
		if (this.hasDim()) {
			this.setProp(Prop.DIM, this.dim().toVec(), seqNum);
		}
		if (this.hasAngle()) {
			this.setProp(Prop.ANGLE, this.angle(), seqNum);
		}
		if (this.hasInertia()) {
			this.setProp(Prop.INERTIA, this.inertia(), seqNum);
		}
		if (this.hasScaling()) {
			this.setProp(Prop.SCALING, this.scaling().toVec(), seqNum);
		}
	}

	override mergeData(data : DataMap, seqNum : number) : void {
		super.mergeData(data, seqNum);

		const changed = this._data.merge(data, seqNum);
		if (changed.size === 0) {
			return;
		}

		if (changed.has(Prop.POS)) {
			this.setPos(<Vec>this._data.get(Prop.POS));
		}
		if (changed.has(Prop.VEL)) {
			this.setVel(<Vec>this._data.get(Prop.VEL));
		}
		if (changed.has(Prop.ACC)) {
			this.setAcc(<Vec>this._data.get(Prop.ACC));
		}
		if (changed.has(Prop.DIM)) {
			this.setDim(<Vec>this._data.get(Prop.DIM));
		}
		if (changed.has(Prop.ANGLE)) {
			this.setAngle(<number>this._data.get(Prop.ANGLE));
		}
		if (changed.has(Prop.INERTIA)) {
			this.setInertia(<number>this._data.get(Prop.INERTIA));
		}
		if (changed.has(Prop.SCALING)) {
			this.setScaling(<Vec>this._data.get(Prop.SCALING));
		}
	}

	private lerp(current : number, next : number, weight : number) {
		if (!defined(current) && !defined(next)) {
			return 0;
		} else if (!defined(current) || this.isSource()) {
			return next;
		} else if (!defined(next)) {
			return current;
		}
		return current + weight * (next - current);
	}
}