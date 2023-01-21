import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data } from 'network/data'

import { options } from 'options'

import { Buffer } from 'util/buffer'
import { Cardinal, CardinalType } from 'util/cardinal'
import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

type ReadyFn = (profile : Profile) => boolean;
type BodyFn = (profile : Profile) => MATTER.Body;
type OnInitFn = (profile : Profile) => void;
type PhysicsFn = (profile : Profile) => void;

export type ProfileInitOptions = {
	pos? : Vec;
	vel? : Vec;
	acc? : Vec;
	dim? : Vec;
}

export type ProfileOptions = {
	bodyFn : BodyFn;

	readyFn? : ReadyFn;
	onInitFn? : OnInitFn;
	prePhysicsFn? : PhysicsFn;
	postPhysicsFn? : PhysicsFn;

	init? : ProfileInitOptions
}

export type MaxSpeedParams = {
	maxSpeed : Vec;
	multiplier : Vec;
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
	private _bodyFn : BodyFn;
	private _onInitFn : OnInitFn;
	private _prePhysicsFn : PhysicsFn;
	private _postPhysicsFn : PhysicsFn;

	private _forces : Buffer<Vec>;
	private _constraints : Map<number, MATTER.Constraint>;

	private _pos : Vec2;
	private _vel : Vec2;
	private _acc : Vec2;
	private _dim : Vec2;
	private _angle : number;
	private _applyScaling : boolean;
	private _scaleFactor : Vec2;
	private _inertia : number;
	private _initialInertia : number;
	private _scaling : Vec2;

	private _maxSpeedParams : MaxSpeedParams;

	private _body : MATTER.Body;

	constructor(profileOptions : ProfileOptions) {
		super(ComponentType.PROFILE);

		this.setName({ base: "profile" });

		this._bodyFn = profileOptions.bodyFn;

		if (defined(profileOptions.readyFn)) { this._readyFn = profileOptions.readyFn; }
		if (defined(profileOptions.onInitFn)) { this._onInitFn = profileOptions.onInitFn; }
		if (defined(profileOptions.prePhysicsFn)) { this._prePhysicsFn = profileOptions.prePhysicsFn; }
		if (defined(profileOptions.postPhysicsFn)) { this._postPhysicsFn = profileOptions.postPhysicsFn; }

		this._constraints = new Map();
		this._forces = new Buffer();

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
		return this.hasPos() && this.hasDim() && (!defined(this._readyFn) || this._readyFn(this));
	}

	override initialize() : void {
		super.initialize();

		this._body = this._bodyFn(this);
		MATTER.Body.setPosition(this._body, this.pos());

		MATTER.Composite.add(game.physics().world(), this._body)
		this._body.label = "" + this.entity().id();
		this._body.parts.forEach((body : MATTER.Body) => {
			body.label = "" + this.entity().id();
		})

		this._initialInertia = this._body.inertia;

		if (defined(this._onInitFn)) {
			this._onInitFn(this);
		}
	}

	override dispose() : void {
		super.dispose();

		if (defined(this._body)) {
			MATTER.World.remove(game.physics().world(), this._body);
		}
		this._constraints.forEach((constraint : MATTER.Constraint) => {
			MATTER.World.remove(game.physics().world(), constraint);
		});
	}

	createRelativeInit(cardinal : CardinalType, objectDim : Vec) : ProfileInitOptions {
		let adjustedPos = this.pos().clone();
		const dim = this.dim();

		if (Cardinal.isLeft(cardinal)) {
			adjustedPos.add({ x: -dim.x / 2 + objectDim.x / 2});
		} else if (Cardinal.isRight(cardinal)) {
			adjustedPos.add({ x: dim.x / 2 - objectDim.x / 2});
		}

		if (Cardinal.isTop(cardinal)) {
			adjustedPos.add({ y: dim.y / 2 - objectDim.y / 2});
		} else if (Cardinal.isBottom(cardinal)) {
			adjustedPos.add({ y: -dim.y / 2 + objectDim.y / 2});
		}

		return {
			pos: adjustedPos,
			dim: Vec2.fromVec(objectDim),
		}
	}


	body() : MATTER.Body { return this._body; }
	addSubProfile(id : number, subProfile : Profile) : Profile {
		subProfile.setEntity(this.entity());
		subProfile.setName({
			parent: this,
			base: subProfile.name(),
			id: id,
		});
		return this.addChild<Profile>(id, subProfile);
	}
	getSubProfile(id : number) : Profile { return this.getChild<Profile>(id); }
	addConstraint(id : number, constraint : MATTER.Constraint) : MATTER.Constraint {
		MATTER.Composite.add(game.physics().world(), constraint);
		this._constraints.set(id, constraint);
		return constraint;
	}
	deleteConstraint(id : number) : void {
		if (!this._constraints.has(id)) {
			return;
		}
		MATTER.World.remove(game.physics().world(), this._constraints.get(id));
	}

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
		this.setAngularVelocity(0);
		this._forces.clear();
	}
	addForce(force : Vec) : void { this._forces.push(force); }
	private applyForces() : void {
		if (this._forces.empty()) {
			return;
		}

		let totalForce = Vec2.zero();
		this._forces.entries().forEach((force : Vec) => {
			totalForce.add(force);
		});

		this.addVel(totalForce);
		this._forces.clear();
	}

	setMaxSpeed(params : MaxSpeedParams) { this._maxSpeedParams = params; }
	private clampSpeed() : void {
		if (!defined(this._maxSpeedParams)) { return; }

		let vel = this.vel();
		const maxSpeed = this._maxSpeedParams.maxSpeed;

		if (Math.abs(vel.x) > maxSpeed.x) {
			vel.x = Math.sign(vel.x) * (maxSpeed.x + this._maxSpeedParams.multiplier.x * (Math.abs(vel.x) - maxSpeed.x));
		}
		if (Math.abs(vel.y) > maxSpeed.y) {
			vel.y = Math.sign(vel.y) * (maxSpeed.y + this._maxSpeedParams.multiplier.y * (Math.abs(vel.y) - maxSpeed.y));
		}
	}

	override prePhysics(millis : number) : void {
		if (this._prePhysicsFn) {
			this._prePhysicsFn(this);
		}

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
			if (acc.lengthSq() > 0) {
				const ts = millis / 1000;
				this.addVel({
					x: acc.x * ts,
					y: acc.y * ts,
				});
			}
		}

		this.applyForces();

		if (this.hasVel()) {
			this.clampSpeed();

			MATTER.Body.setVelocity(this._body, this.vel());
		}
		MATTER.Body.setPosition(this._body, this.pos());

		// Update child objects afterwards
		super.prePhysics(millis);
	}

	override postPhysics(millis : number) : void {
		if (this.hasAngle() && !Data.equals(this._angle, this._body.angle)) {
			this.setAngle(this._body.angle);
		}
		if (this.hasVel() && !Data.equals(this._vel.toVec(), this._body.velocity)) {
			this.setVel(this._body.velocity);
		}

		if (this.isSource()) {
			this.setPos(this._body.position);
		} else {
			const weight = Math.min(Math.max(this.millisSinceImport() - game.connection().ping() / 2, 0) / options.maxPredictionMillis, 1);
			this._pos.lerp(this._body.position, weight * options.predictionWeight);
		}

		if (this._postPhysicsFn) {
			this._postPhysicsFn(this);
		}

		// Update child objects afterwards.
		super.postPhysics(millis);
	}
} 