import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, AttributeType, StatType } from 'game/component/api'
import { Stats } from 'game/component/stats'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { DepthType } from 'game/factory/api'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { CollisionBuffer, RecordType } from 'game/util/collision_buffer'

import { settings } from 'settings'

import { Box2 } from 'util/box'
import { Buffer } from 'util/buffer'
import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { Smoother } from 'util/smoother'
import { Timer } from 'util/timer'
import { Vec, Vec2, Vec3 } from 'util/vector'
import { SmoothVec } from 'util/vector/smooth_vector'

type ReadyFn = (profile : Profile) => boolean;
type BodyFn = (profile : Profile) => MATTER.Body;
type OnBodyFn = (profile : Profile) => void;
type PhysicsFn = (profile : Profile) => void;
type ModifyProfileFn = (profile : Profile) => void;

export type ProfileInitOptions = {
	pos? : Vec;
	vel? : Vec;
	acc? : Vec;
	dim? : Vec;
	scaling? : Vec;
	angle? : number;

	degraded? : boolean;
}

export type ProfileOptions = {
	bodyFn : BodyFn;

	readyFn? : ReadyFn;
	prePhysicsFn? : PhysicsFn;
	postPhysicsFn? : PhysicsFn;

	init : ProfileInitOptions
}

export type MoveToParams = {
	millis : number;
	posEpsilon : number;
	maxAccel : number;
}

export type MinimapOptions = {
	color : string;
	depthType? : DepthType;
}

export class Profile extends ComponentBase implements Component {

	private static readonly _minQuantization = 1e-3;
	private static readonly _vecEpsilon = 3 * Profile._minQuantization;
	private static readonly _degradedVecEpsilon = 10 * Profile._vecEpsilon;
	private static readonly _angleEpsilon = 1e-2;
	private static readonly _knockbackTimeMin = 250;
	private static readonly _knockbackTimeVariance = 250;

	private _degraded : boolean;
	private _bodyFn : BodyFn;
	private _onBodyFns : Array<OnBodyFn>;
	private _readyFn : ReadyFn;
	private _prePhysicsFn : PhysicsFn;
	private _postPhysicsFn : PhysicsFn;

	private _applyScaling : boolean;
	private _attachId : Optional<number>;
	private _attachConstraint : Optional<MATTER.Constraint>;
	private _attachOffset : Vec2;
	private _collisionBuffer : CollisionBuffer;
	private _constraints : Map<number, MATTER.Constraint>;
	private _constraintNextId : number;
	private _forces : Buffer<Vec>;
	private _knockbackTimer : Timer;
	private _limitFn : Optional<ModifyProfileFn>;
	private _tempLimitFns : Map<number, ModifyProfileFn>;
	private _outOfBoundsFn : Optional<ModifyProfileFn>;
	private _scaleFactor : Vec2;
	private _smoother : Smoother;
	private _occluded : boolean;
	private _visible : boolean;
	private _wrap : number;

	private _pos : SmoothVec;
	private _vel : SmoothVec;
	private _acc : Vec2;
	private _dim : Vec2;
	private _angle : number;
	private _inertia : number;
	private _initialInertia : number;
	private _scaling : Vec2;

	private _body : MATTER.Body;

	constructor(profileOptions : ProfileOptions) {
		super(ComponentType.PROFILE);

		this._degraded = false;
		this._bodyFn = profileOptions.bodyFn;
		this._onBodyFns = new Array();

		if (profileOptions.readyFn) { this._readyFn = profileOptions.readyFn; }
		if (profileOptions.prePhysicsFn) { this._prePhysicsFn = profileOptions.prePhysicsFn; }
		if (profileOptions.postPhysicsFn) { this._postPhysicsFn = profileOptions.postPhysicsFn; }

		this._applyScaling = false;
		this._attachId = new Optional();
		this._attachConstraint = new Optional();
		this._attachOffset = Vec2.zero();
		this._collisionBuffer = new CollisionBuffer();
		this._constraints = new Map();
		this._constraintNextId = 1;
		this._forces = new Buffer();
		this._knockbackTimer = this.newTimer({
			canInterrupt: true,
		});
		this._limitFn = new Optional();
		this._tempLimitFns = new Map();
		this._outOfBoundsFn = new Optional();
		this._scaleFactor = Vec2.one();
		this._smoother = new Smoother();
		this._occluded = false;
		this._visible = true;
		this._wrap = 0;

		if (profileOptions.init) {
			this.initFromOptions(profileOptions.init);
		}

		this._body = null;

		this.addProp<number>({
			has: () => { return this._attachId.has(); },
			export: () => { return this._attachId.get(); },
			import: (obj : number) => { this._attachId.set(obj); }
		});
		this.addProp<Vec>({
			has: () => { return !this._attachOffset.isZero(); },
			export: () => { return this._attachOffset.toVec(); },
			import: (obj : Vec) => { this._attachOffset.copyVec(obj); }
		});

		this.addProp<Vec>({
			has: () => { return this.hasPos(); },
			export: () => {return this._pos.toVec(); },
			import: (obj : Vec) => {
				this.setPos(obj);
				this._pos.setBase(obj);
			},
			options: {
				filters: GameData.udpFilters,
				equals: (a : Vec, b : Vec) => {
					return SmoothVec.approxEquals(a, b, this.vecEpsilon());
				},
			},
		});
		this.addProp<Vec>({
			has: () => { return this.hasVel(); },
			export: () => { return this.vel().toVecXY(); },
			import: (obj : Vec) => {
				this.setVel(obj);
				this.vel().setBase(obj);
			},
			options: {
				filters: GameData.udpFilters,
				equals: (a : Vec, b : Vec) => {
					return SmoothVec.approxEquals(a, b, this.vecEpsilon());
				},
			},
		});
		this.addProp<Vec>({
			has: () => { return this.hasAcc(); },
			export: () => { return this.acc().toVec(); },
			import: (obj : Vec) => { this.setAcc(obj); },
			options: {
				filters: GameData.udpFilters,
				equals: (a : Vec, b : Vec) => {
					return Vec2.approxEquals(a, b, this.vecEpsilon());
				},
			},
		});
		this.addProp<Vec>({
			has: () => { return this.hasDim(); },
			export: () => { return this.unscaledDim().toVec(); },
			import: (obj : Vec) => { this.setDim(obj); },
		});
		this.addProp<number>({
			has: () => { return this.hasAngle(); },
			export: () => { return this.angle(); },
			import: (obj : number) => { this.setAngle(obj); },
			options: {
				filters: GameData.udpFilters,
				equals: (a : number, b : number) => {
					return Math.abs(a - b) < Profile._angleEpsilon;
				},
			},
		});
		this.addProp<number>({
			has: () => { return this.hasBody() && this.hasAngle(); },
			export: () => { return this.angularVelocity(); },
			import: (obj : number) => { this.setAngularVelocity(obj); },
			options: {
				filters: GameData.udpFilters,
				equals: (a : number, b : number) => {
					return Math.abs(a - b) < Profile._angleEpsilon;
				},
			},
		});
		this.addProp<number>({
			has: () => { return this.hasInertia(); },
			export: () => { return this.inertia(); },
			import: (obj : number) => { this.setInertia(obj); },
		});
		this.addProp<Vec>({
			has: () => { return this.hasScaling(); },
			export: () => { return this.scaling().toVec(); },
			import: (obj : Vec) => { this.setScaling(obj); },
			options: {
				equals: (a : Vec, b : Vec) => {
					return Vec2.approxEquals(a, b, this.vecEpsilon());
				},
			},
		});
	}

	initFromOptions(init : ProfileInitOptions) : void {
		if (init.degraded) { this._degraded = init.degraded; }
		if (init.pos) { this.setPos(init.pos); }
		if (init.vel) { this.setVel(init.vel); }
		if (init.acc) { this.setAcc(init.acc); }
		if (init.dim) { this.setDim(init.dim); }
		if (init.scaling) { this.setScaling(init.scaling); }
		if (init.angle) { this.setAngle(init.angle); }
	}

	override ready() : boolean {
		return super.ready() && this.hasPos() && this.hasDim() && (!defined(this._readyFn) || this._readyFn(this));
	}

	override initialize() : void {
		super.initialize();

		this._body = this._bodyFn(this);
		MATTER.Body.setPosition(this._body, this._pos);

		MATTER.Composite.add(game.physics().world(), this._body)
		this._body.label = "" + this.entity().id();
		this._body.parts.forEach((body : MATTER.Body) => {
			body.label = "" + this.entity().id();
		})

		this._initialInertia = this._body.inertia;

		this._onBodyFns.forEach((fn : OnBodyFn) => {
			fn(this);
		});
		this._onBodyFns = [];
	}

	override setState(state : GameObjectState) : void {
		super.setState(state);

		this.onBody((profile : Profile) => {
			if (state === GameObjectState.DEACTIVATED) {
				// Hack to remove the body from the scene.
				MATTER.Body.setPosition(profile.body(), { x: this._pos.x, y: game.level().bounds().min.y - 10 });
			} else {
				MATTER.Body.setPosition(profile.body(), this._pos);
			}
		});
	}

	override dispose() : void {
		super.dispose();

		if (this._body !== null) {
			MATTER.World.remove(game.physics().world(), this._body);
		}
		this._constraints.forEach((constraint : MATTER.Constraint) => {
			MATTER.World.remove(game.physics().world(), constraint);
		});
	}

	relativePos(cardinal : CardinalDir, objectDim? : Vec) : Vec2 {
		let adjustedPos = this._pos.clone();
		const dim = this.scaledDim();

		if (!objectDim) {
			objectDim = { x: 0, y: 0 };
		}

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
		return adjustedPos;
	}
	createRelativeInit(cardinal : CardinalDir, objectDim : Vec, offset? : Vec) : ProfileInitOptions {
		let pos = this.relativePos(cardinal, objectDim);
		if (offset) {
			pos.add(offset);
		}
		return {
			pos: pos,
			dim: Vec2.fromVec(objectDim),
		}
	}

	hasBody() : boolean { return this._body !== null; } 
	// TODO: make private
	body() : MATTER.Body { return this._body; }
	onBody(fn : OnBodyFn) : void {
		if (this.hasBody()) {
			fn(this);
		} else {
			this._onBodyFns.push(fn);
		}
	}
	visible() : boolean { return this.hasBody() && this._visible && !this._occluded; }
	setVisible(visible : boolean) : void {
		this._visible = visible;
		this.onBody((profile : Profile) => {
			profile.body().render.visible = this.visible();
		});
	}
	setOccluded(occluded : boolean) : void {
		this._occluded = occluded;
		this.onBody((profile : Profile) => {
			profile.body().render.visible = this.visible();
		});
	}
	setMinimapOptions(options : MinimapOptions) : void {
		this.onBody((profile : Profile) => {
			profile.body().render.fillStyle = options.color;
			profile.body().render.strokeStyle = options.color;
			profile.body().render.visible = true;

			if (options.depthType) {
				profile.body().plugin.zIndex = options.depthType;
			}
		});
	}

	collisionBuffer() : CollisionBuffer { return this._collisionBuffer; }

	constraint(id : number) : MATTER.Constraint { return this._constraints.get(id); }
	hasConstraint(id : number) : boolean { return this._constraints.has(id); }
	addConstraint(constraint : MATTER.Constraint) : number {
		MATTER.Composite.add(game.physics().world(), constraint);
		this._constraints.set(this._constraintNextId, constraint);
		this._constraintNextId++;
		return this._constraintNextId - 1;
	}
	deleteConstraint(id : number) : void {
		if (!this.hasConstraint(id)) {
			console.error("Error: trying to delete nonexistent constraint", id);
			return;
		}
		MATTER.World.remove(game.physics().world(), this._constraints.get(id));
	}

	private hasPos() : boolean { return defined(this._pos); }
	pos() : SmoothVec { return this._pos; }
	getRenderPos() : Vec3 {
		let renderPos = this.hasPos() ? this._pos.clone() : Vec3.zero();
		const bounds = game.level().bounds();
		renderPos.x += this._wrap * bounds.width();
		return renderPos;
	}
	setPos(vec : Vec) : void {
		if (!this.hasPos()) { this._pos = SmoothVec.zero(); }

		this._pos.copyVec(vec);
		this._pos.roundToEpsilon(Profile._minQuantization);
	}
	wrap() : number { return this._wrap; }

	hasVel() : boolean { return defined(this._vel); }
	vel() : SmoothVec { return this.hasVel() ? this._vel : SmoothVec.zero(); }
	setVel(vec : Vec) : void {
		if (!this.hasVel()) { this._vel = SmoothVec.zero(); }

		this._vel.copyVec(vec);
	}
	addVel(delta : Vec) : void {
		if (!this.hasVel()) { this._vel = SmoothVec.zero(); }

		this._vel.add(delta);
	}
	capSpeed(speed : number) : void {
		if (!this.hasVel()) {
			this._vel = SmoothVec.zero();
			return;
		}

		if (this._vel.lengthSq() > speed * speed) {
			this._vel.normalize().scale(speed);
		}
	}
	// Skip very first update, but only if we're the source
	private shouldUpdateVel() : boolean { return (!this.isSource() || this.updateCalls() > 1) && this.hasVel(); }

	hasAcc() : boolean { return defined(this._acc); }
	acc() : Vec2 { return this.hasAcc() ? this._acc : Vec2.zero(); }
	setAcc(vec : Vec) : void {
		if (!this.hasAcc()) { this._acc = Vec2.zero(); }

		this._acc.copyVec(vec);
	}

	private hasDim() : boolean { return defined(this._dim); }
	unscaledDim() : Vec2 { return this._dim; }
	width() : number { return this.scaledDim().x; }
	height() : number { return this.scaledDim().y; }
	scaledDim() : Vec2 { return this.hasScaling() ? this.unscaledDim().clone().mult(this.scaling()) : this.unscaledDim(); }
	setDim(vec : Vec) : void {
		if (this.hasDim()) {
			if (!Vec2.approxEquals(this._dim.toVec(), vec, this.vecEpsilon())) {
				console.error("Error: dimension is already initialized for", this.name());
			}
			return;
		}
		this._dim = Vec2.fromVec(vec);
	}

	hasAngle() : boolean { return defined(this._angle); }
	angle() : number { return this.hasAngle() ? this._angle : 0; }
	angleDeg() : number { return this.angle() * 180 / Math.PI; }
	addAngle(delta : number) : void { this.setAngle(this.angle() + delta); }
	addAngleDeg(delta : number) : void { this.setAngle(this.angle() + delta * Math.PI / 180); }
	setAngle(angle : number) : void { this._angle = Fns.normalizeRad(angle); }
	setAngleDeg(angle : number) : void { this.setAngle(angle * Math.PI / 180); }
	angularVelocity() : number { return this._body !== null ? this._body.angularVelocity : 0; }
	setAngularVelocity(vel : number) : void {
		if (!this.hasAngle()) { this.setAngle(0); }

		this.onBody((profile : Profile) => {
			MATTER.Body.setAngularVelocity(profile.body(), vel);
		});
	}
	addAngularVelocity(delta : number) : void {
		if (!this.hasAngle()) { this.setAngle(0); }

		this.onBody((profile : Profile) => {
			MATTER.Body.setAngularVelocity(profile.body(), profile.body().angularVelocity + delta);
		});
	}

	hasInertia() : boolean { return defined(this._inertia); }
	inertia() : number { return this._inertia; }
	setInertia(inertia : number) : void { this._inertia = inertia; }
	resetInertia() : void { this._inertia = this._initialInertia; }

	hasScaling() : boolean { return defined(this._scaling) && defined(this._scaling.x, this._scaling.y); }
	scaling() : Vec2 { return this.hasScaling() ? this._scaling : Vec2.one(); }
	setScaleFactor(factor : number) : void {
		this.setScaling({ x: factor, y : factor });
	}
	setScaling(vec : Vec) : void {
		if (!defined(this._scaling)) {
			this._scaling = Vec2.one();
		}
		if (Vec2.approxEquals(this._scaling.toVec(), vec, 1e-2)) { return; }

		if (vec.hasOwnProperty("x")) {
			this._scaleFactor.x = vec.x / this._scaling.x;
		}
		if (vec.hasOwnProperty("y")) {
			this._scaleFactor.y = vec.y / this._scaling.y;
		}

		if (this._scaleFactor.x === 1 && this._scaleFactor.y === 1) {
			return;
		}

		this._applyScaling = true;
		this._scaling.copyVec(vec);
	}

	contains(point : Vec, buffer? : number) : boolean {
		if (!buffer) {
			buffer = 0;
		}

		const dim = this.scaledDim();

		if (point.x > this._pos.x + dim.x / 2 + buffer) { return false; }
		if (point.x < this._pos.x - dim.x / 2 - buffer) { return false; }
		if (point.y > this._pos.y + dim.y / 2 + buffer) { return false; }
		if (point.y < this._pos.y - dim.y / 2 - buffer) { return false; }

		return true;
	}
	containsProfile(profile : Profile, buffer? : number) : boolean {
		if (!buffer) {
			buffer = 0;
		}

		const dim = this.scaledDim();
		const otherPos = profile.pos();
		const otherDim = profile.scaledDim();
		if (otherPos.x + otherDim.x / 2 > this._pos.x + dim.x / 2 + buffer) { return false; }
		if (otherPos.x - otherDim.x / 2 < this._pos.x - dim.x / 2 - buffer) { return false; }
		if (otherPos.y + otherDim.y / 2 > this._pos.y + dim.y / 2 + buffer) { return false; }
		if (otherPos.y - otherDim.y / 2 < this._pos.y - dim.y / 2 - buffer) { return false; }

		return true;
	}
	overlap(other : Profile) : Vec2 {
		const dim = this.scaledDim();
		const otherDim = other.scaledDim();

		const dist = this._pos.clone().sub(other.pos()).abs();
		return Vec2.fromVec(dim).add(otherDim).scale(0.5).sub(dist).div(dim);
	}
	isXCollision(overlap : Vec, vel : Vec) : boolean {
		return overlap.x > 0 && overlap.y > 0 && !this.isYCollision(overlap, vel);
	}
	isYCollision(overlap : Vec, vel : Vec) : boolean {
		return overlap.x > 0 && overlap.y > 0 && Math.abs(overlap.x * vel.y) >= Math.abs(overlap.y * vel.x);
	}

	attached() : boolean { return this._attachId.has(); }
	attachId() : number { return this._attachId.get(); }
	attachEntity() : [Entity, boolean] {
		if (!this.attached()) { return [null, false]; }

		return game.entities().getEntity(this.attachId());
	}
	attachTo(profile : Profile, offset : Vec) : boolean {
		if (!profile.initialized()) {
			console.error("Error: cannot attach %s to uninitialized %s", this.name(), profile.name());
			return false;
		}

		this._attachId.set(profile.entity().id());
		this._attachOffset.copyVec(offset);

		profile.onBody((parent : Profile) => {
			this.onBody((self : Profile) => {
				const constraint = MATTER.Constraint.create({
					bodyA: parent.body(),
					bodyB: self.body(),
					pointA: this._attachOffset,
					stiffness: 1,
					length: 0,
					render: {
						visible: false,
					},
				});
				this._attachConstraint.set(constraint)
				this.addConstraint(constraint);
			});
		});
		this.stop();
		return true;
	}
	unattach() : void {
		this._attachId.clear();
		if (this._attachConstraint.has()) {
			MATTER.World.remove(game.physics().world(), this._attachConstraint.get());
		}
	}
	// Return true if successfully attached
	private checkAttachment() : boolean {
		if (!this.attached()) {
			this.unattach();
			return false;
		}

		const [entity, ok] = game.entities().getEntity(this._attachId.get());
		if (!ok || !entity.hasProfile()) {
			this.unattach();
			return false;
		}

		if (!this.isSource() && this.attached() && !this._attachConstraint.has()) {
			return this.attachTo(entity.profile(), this._attachOffset);
		}
		return true;
	}
	snapTo(profile : Profile, snapLimit? : number) : void {
		const overlap = this.overlap(profile);
		const vel = this.vel();
		const relativeVel = vel.clone().sub(profile.vel());
		if (this.isXCollision(overlap, relativeVel)) {
			const dir = -Math.sign(relativeVel.x);
			const desired = profile.pos().x + dir * (profile.scaledDim().x + this.scaledDim().x) / 2 
			const offset = desired - this._pos.x;
			const otherOffset = offset * vel.y / vel.x;

			if (snapLimit > 0 && offset * offset + otherOffset * otherOffset > snapLimit * snapLimit) {
				return;
			}

			this.setPos({
				x: desired,
				y: this._pos.y + otherOffset,
			});
		} else if (this.isYCollision(overlap, relativeVel)) {
			const dir = -Math.sign(relativeVel.y);
			const desired = profile.pos().y + dir * (profile.scaledDim().y + this.scaledDim().y) / 2 
			const offset = desired - this._pos.y;
			const otherOffset = offset * vel.x / vel.y;

			if (snapLimit > 0 && offset * offset + otherOffset * otherOffset > snapLimit * snapLimit) {
				return;
			}

			this.setPos({
				x: this._pos.x + otherOffset,
				y: desired,
			});
		} else {
			return;
		}

		if (this._body !== null) {
			MATTER.Body.setPosition(this._body, {
				x: this._pos.x,
				y: this._pos.y,
			});
		}
	}
	snapWithOffset(profile : Profile, offset : Vec) : void {
		let angledOffset = Vec2.fromVec(offset).setAngleRad(profile.angle());
		this.setPos({
			x: profile.pos().x + angledOffset.x,
			y: profile.pos().y + angledOffset.y,
		});
	}
	moveTo(point : Vec, params : MoveToParams) : void {
		if (params.millis <= 0) { return; }

		if (game.level().isCircle()) {
			if (this._pos.x - point.x > game.level().bounds().width() / 2) {
				point.x += game.level().bounds().width();
			} else if (point.x - this._pos.x > game.level().bounds().width() / 2) {
				point.x -= game.level().bounds().width();
			}
		} else {
			game.level().clampPos(point);
		}

		const dt = params.millis / 1000;
		const distVec = this._pos.clone().sub(point).negate();
		if (!this.hasVel()) {
			this.setVel({x: 0, y: 0});
		}
		if (this.vel().length() * dt >= distVec.length() || distVec.length() < params.posEpsilon) {
			this.setPos(point);
			this.stop();
			return;
		}

		// Turn to point
		this.vel().setAngleRad(distVec.angleRad());

		// Accelerate or deccelerate
		const acc = Vec2.fromVec(distVec);
		const slowDist = this.vel().lengthSq() / (2 * params.maxAccel);
		if (distVec.lengthSq() > slowDist * slowDist) {
			acc.normalize().scale(params.maxAccel);
		} else {
			acc.normalize().scale(-params.maxAccel);
		}
		this.setAcc(acc);
	} 
	stop() : void {
		this.setVel({x: 0, y: 0});
		this.setAcc({x: 0, y: 0});

		if (this.hasAngle()) {
			this.setAngularVelocity(0);
		}
		this._forces.clear();
	}
	uprightStop() : void {
		this.stop();
		if (this.hasAngle()) {
			this.setAngle(0);
		}
	}
	addForce(force : Vec) : void { this._forces.push(force); }
	private applyForces() : void {
		if (this._forces.empty()) {
			return;
		}

		let totalForce = Vec2.zero();
		while(!this._forces.empty()) {
			totalForce.add(this._forces.pop());
		}
		totalForce.scale(1 / this._body.mass);
		this.addVel(totalForce)

		const weight = Math.min(totalForce.lengthSq(), 1);
		this._knockbackTimer.start(Math.max(this._knockbackTimer.millisLeft(), Profile._knockbackTimeMin + weight * Profile._knockbackTimeVariance));

		this._forces.clear();
	}
	knockbackMillis() : number { return this._knockbackTimer.millisLeft(); }

	private vecEpsilon() : number { return this._degraded ? Profile._degradedVecEpsilon : Profile._vecEpsilon; }
	setLimitFn(limitFn : ModifyProfileFn) { this._limitFn.set(limitFn); }
	addTempLimitFn(limitFn : ModifyProfileFn) : number {
		const index = this._tempLimitFns.size + 1;
		this._tempLimitFns.set(index, limitFn);
		return index;
	}
	deleteTempLimitFn(index : number) : void { this._tempLimitFns.delete(index); }
	clearTempLimitFns() : void { this._tempLimitFns.clear(); }
	setOutOfBoundsFn(outOfBoundsFn : ModifyProfileFn) : void { this._outOfBoundsFn.set(outOfBoundsFn); }
	private applyLimits() : void {
		if (this._outOfBoundsFn.has()) {
			const bounds = game.level().bounds();
			if (bounds.ySide(this._pos) !== 0 || !game.level().isCircle() && bounds.xSide(this._pos) !== 0) {
				this._outOfBoundsFn.get()(this);
			} 
		} 

		game.level().clampPos(this._pos);

		if (this._limitFn.has()) {
			this._limitFn.get()(this);
		}
		this._tempLimitFns.forEach((fn : ModifyProfileFn) => {
			fn(this);
		});
	}

	override prePhysics(stepData : StepData) : void {
		// super.prePhysics() called later

		const millis = stepData.millis;

		if (this._prePhysicsFn) {
			this._prePhysicsFn(this);
		}

		if (this._visible && this._occluded) {
			this.setOccluded(false);
		}

		if (this._applyScaling) {
			MATTER.Body.scale(this._body, this._scaleFactor.x, this._scaleFactor.y);
			this._applyScaling = false;
		}
		if (this.hasAngle()) {
			MATTER.Body.setAngle(this._body, this.angle());
		}
		if (this.hasInertia()) {
			MATTER.Body.setInertia(this._body, this.inertia());
		}

		const attached = this.checkAttachment();

		if (!attached) {
			let weight = 0;
			if (settings.predictionTime() > 0) {
				this._smoother.setDiff(game.runner().tickDiff());
				weight = this._smoother.weight();
			}
			this.vel().snap(weight);
			if (this._pos.snapDistSq(weight) > 10) {
				this._pos.snap(0);
			} else {
				this._pos.snap(Math.min(weight, 1));
			}

			if (this.hasAcc()) {
				const acc = this.acc();
				if (!acc.isZero()) {
					const scale = millis / 1000;
					this.addVel({
						x: acc.x * scale,
						y: acc.y * scale,
					});
				}
			}
		}

		this.applyForces();
		this.applyLimits();

		if (!attached) {
			if (this.shouldUpdateVel()) {
				MATTER.Body.setVelocity(this._body, this.vel());
			}
			MATTER.Body.setPosition(this._body, this._pos);
		}

		this._collisionBuffer.reset();

		// Update child objects afterwards
		super.prePhysics(stepData);
	}

	collide(collision : MATTER.Collision, other : Entity) : void {
		if (this._body.isSensor || this._body.isStatic || other.profile().body().isSensor) {
			return;
		}

		const otherProfile = other.profile();

		// Smooth out "pixel" collisions
		let normal = Vec2.fromVec(collision.normal);
		let pen = Vec2.fromVec(collision.penetration);
		let fixed = false;

		// Find overlap of rectangle bounding boxes.
		// Skip attached profiles since it doesn't matter.
		if (other.allTypes().has(EntityType.BOUND) && !this._attachId.has()) {
			let overlap = this.overlap(other.profile());
			let vel = this.vel();
			const yCollision = this.isYCollision(overlap, vel);
			if (other.allTypes().has(EntityType.FLOOR)) {
				if (pen.x !== 0) {
					normal.x = 0;
					normal.y = this._pos.y > other.profile().pos().y ? 1 : -1;
					pen.x = 0;
					pen.y = -normal.y * overlap.y
					fixed = true;
				}
			} else {
				if (yCollision) {
					pen.x = 0;
					normal.x = 0;
					normal.y = Math.sign(normal.y);

					if (Math.sign(vel.y) === Math.sign(this._pos.y - otherProfile.pos().y)) {
						// Moving away from the collision
						pen.scale(0);
						fixed = true;
					} else if (Math.abs(overlap.x) < 0.01 || Math.abs(normal.x) > 0.99) {
						// Either overlap in other dimension is too small or collision direction is in disagreement.
						pen.scale(0);
						fixed = true;
					}
				} else {
					pen.y = 0;
					normal.x = Math.sign(normal.x);
					normal.y = 0;

					if (Math.sign(vel.x) === Math.sign(this._pos.x - otherProfile.pos().x)) {
						// Moving away from the collision
						pen.scale(0);
						fixed = true;
					} else if (Math.abs(overlap.y) < 0.01 || Math.abs(normal.y) > 0.99) {
						// Either overlap in other dimension is too small or collision direction is in disagreement.
						pen.scale(0);
						fixed = true;
					}
				}
			}
		}

		collision.normal.x = normal.x;
		collision.normal.y = normal.y;
		collision.penetration.x = pen.x;
		collision.penetration.y = pen.y;

		this._collisionBuffer.pushRecord({
			entity: other,
			collision: collision,
			fixed: fixed,
		});
	}

	override postPhysics(stepData : StepData) : void {
		// super.postPhysics() called later

		// Fix getting stuck on small corners
		const millis = stepData.millis;
		if (this._collisionBuffer.hasRecords()
			&& this._collisionBuffer.fixed()
			&& !this._attachId.has()) {

			// Only fix x collisions since y collisions might cause fall through floor.
			const maxRecord = this._collisionBuffer.record(RecordType.MAX_PEN_X);
			const minRecord = this._collisionBuffer.record(RecordType.MIN_PEN_X);
			if (maxRecord.collision.penetration.x <= 0 && this.vel().x > 0
				|| minRecord.collision.penetration.x >= 0 && this.vel().x < 0) {
				MATTER.Body.setVelocity(this._body, {
					x: Math.sign(this.vel().x) * Math.max(Math.abs(this.vel().x), Math.abs(this._body.velocity.x)),
					y: this._body.velocity.y,
				});
				MATTER.Body.setPosition(this._body, {
					x: this._body.position.x + this._body.velocity.x * millis / 1000,
					y: this._body.position.y + this.vel().y * millis / 1000,
				});
			}
		}

		if (this._postPhysicsFn) {
			this._postPhysicsFn(this);
		}

		if (this.hasAngle()) {
			this.setAngle(this._body.angle);
		}

		if (this.shouldUpdateVel()) {
			this.setVel(this._body.velocity);

			if (!this.isSource()) {
				this._vel.setPredict(this._body.velocity);
			}
		}

		this.setPos(this._body.position);
		if (!this.isSource()) {
			this._pos.setPredict(this._body.position);
		}

		this._wrap = 0;
		if (game.level().isCircle()) {
			const bounds = game.level().bounds();
			const target = game.lakitu().target();
			if (this._pos.x - target.x > bounds.width() / 2) {
				this._wrap = -1;
			} else if (target.x - this._pos.x > bounds.width() / 2) {
				this._wrap = 1;
			}
		}

		// Update child objects afterwards.
		super.postPhysics(stepData);
	}

	override preRender() : void {
		super.preRender();

		// Wrap the object for visualization if we're in a circle level
		// Putting this here introduces some minimap flicker since MATTER.Render is synced with RequestAnimationFrame, not render()
		// Disabled because it complicates a lot of stuff.
		/*
		if (game.level().isCircle()) {
			MATTER.Body.setPosition(this._body, this.getRenderPos());
		}
		*/
	}
} 