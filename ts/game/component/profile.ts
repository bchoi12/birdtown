import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'network/data'

import { options } from 'options'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

type ReadyFn = (profile : Profile) => boolean;
type InitFn = (profile : Profile) => void;
type OnInitFn = (profile : Profile) => void;

export type ProfileInitOptions = {
	pos? : Vec;
	vel? : Vec;
	acc? : Vec;
	dim? : Vec;
}

export type ProfileOptions = {
	initFn : InitFn;

	init? : ProfileInitOptions
	readyFn? : ReadyFn;
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

	private _body : MATTER.Body;

	constructor(profileOptions : ProfileOptions) {
		super(ComponentType.PROFILE);

		this.setName({ base: "profile" });

		this._readyFn = defined(profileOptions.readyFn) ? profileOptions.readyFn : () => { return true; };
		this._initFn = profileOptions.initFn;

		if (profileOptions.init) {
			this.initFromOptions(profileOptions.init);
		}

		this.registerProp(Prop.POS, {
			has: () => { return this.hasPos(); },
			export: () => { return this.pos().toVec(); },
			import: (obj : Object) => { this.setPos(<Vec>obj); }
		});
		this.registerProp(Prop.VEL, {
			has: () => { return this.hasVel(); },
			export: () => { return this.vel().toVec(); },
			import: (obj : Object) => { this.setVel(<Vec>obj); }
		});
		this.registerProp(Prop.ACC, {
			has: () => { return this.hasAcc(); },
			export: () => { return this.acc().toVec(); },
			import: (obj : Object) => { this.setAcc(<Vec>obj); }
		});
		this.registerProp(Prop.DIM, {
			has: () => { return this.hasDim(); },
			export: () => { return this.dim().toVec(); },
			import: (obj : Object) => { this.setDim(<Vec>obj); }
		});
		this.registerProp(Prop.ANGLE, {
			has: () => { return this.hasAngle(); },
			export: () => { return this.angle(); },
			import: (obj : Object) => { this.setAngle(<number>obj); }
		});
		this.registerProp(Prop.INERTIA, {
			has: () => { return this.hasInertia(); },
			export: () => { return this.inertia(); },
			import: (obj : Object) => { this.setInertia(<number>obj); }
		});
		this.registerProp(Prop.SCALING, {
			has: () => { return this.hasScaling(); },
			export: () => { return this.scaling().toVec(); },
			import: (obj : Object) => { this.setScaling(<Vec>obj); }
		});
	}

	initFromOptions(init : ProfileInitOptions) : void {
		if (init.pos) { this.setPos(init.pos); }
		if (init.vel) { this.setVel(init.vel); }
		if (init.acc) { this.setAcc(init.acc); }
		if (init.dim) { this.setDim(init.dim); }
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

	// TODO: deprecate set()
	set(body : MATTER.Body) : void { this._body = body; }
	body() : MATTER.Body { return this._body; }

	/*
	addCollider(inputKey : number, collider : Collider) : Collider {
		const key = this._numProps + inputKey;

		if (this._colliders.has(key)) {
			console.error("Error: trying to add collider with duplicate key", inputKey, collider);
			return;
		}

		collider.setEntity(this.entity());
		if (this._dataBuffers.has(key)) {
			collider.data().merge(this._dataBuffers.get(key));
		}
		collider.initialize();
		this._colliders.set(key, collider);
		return collider;
	}
	collider(key? : number) : Collider {
		if (!defined(key)) { 
			return this._collider;
		}

		return this._colliders.get(this._numProps + key);
	}
	addConstraint(key : number, constraint : MATTER.Constraint) : MATTER.Constraint {
		if (this._constraints.has(key)) {
			console.error("Error: trying to add constraint with duplicate key", key, constraint);
			return;
		}

		MATTER.Composite.add(game.physics().world, constraint);
		this._constraints.set(key, constraint);
		return constraint;
	}
	*/

	private hasPos() : boolean { return defined(this._pos); }
	pos() : Vec2 { return this._pos; }
	setPos(vec : Vec) : void {
		if (!this.hasPos()) { this._pos = Vec2.zero(); }

		this._pos.copyVec(vec);
	}
	addPos(delta : Vec) : void {
		if (!this.hasPos()) { this._pos = Vec2.zero(); }

		this._pos.add(delta);
	}

	hasVel() : boolean { return defined(this._vel); }
	vel() : Vec2 { return this._vel; }
	setVel(vec : Vec) : void {
		if (!this.hasVel()) { this._vel = Vec2.zero(); }

		this._vel.copyVec(vec);
	}
	addVel(delta : Vec) : void {
		if (!this.hasVel()) { this._vel = Vec2.zero(); }

		this._vel.add(delta);
	}

	hasAcc() : boolean { return defined(this._acc); }
	acc() : Vec2 { return this._acc; }
	setAcc(vec : Vec) : void {
		if (!this.hasAcc()) { this._acc = Vec2.zero(); }

		this._acc.copyVec(vec);
	}
	addAcc(delta : Vec) : void {
		if (!this.hasAcc()) { this._acc = Vec2.zero(); }

		this._acc.add(delta);
	}

	private hasDim() : boolean { return defined(this._dim); }
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

	hasInertia() : boolean { return defined(this._inertia); }
	inertia() : number { return this._inertia; }
	setInertia(inertia : number) : void { this._inertia = inertia; }
	resetInertia() : void { this._inertia = this._initialInertia; }

	hasScaling() : boolean { return defined(this._scaling) && defined(this._scaling.x, this._scaling.y); }
	scaling() : Vec2 { return this._scaling; }
	setScaling(vec : Vec) {
		if (!defined(this._scaling)) {
			this._scaling = Vec2.one();
		}
		if (Data.equals(this._scaling.toVec(), vec)) { return; }

		this._scaleFactor = Vec2.one();
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

	stop() : void {
		this.setVel({x: 0, y: 0});
		this.setAcc({x: 0, y: 0});
	}
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

		if (this.hasAngle() && !Data.equals(this._angle, this._body.angle)) {
			this.setAngle(this._body.angle);
		}
		if (this.hasVel() && !Data.equals(this._vel.toVec(), this._body.velocity)) {
			this.setVel(this._body.velocity);
		}

		if (this.isSource()) {
			this.setPos(this._body.position);
		} else {
			// TODO: refine this
			this._pos.lerpSeparate(this._body.position, {x: options.predictionWeight, y: options.predictionWeight});
		}
	}
}