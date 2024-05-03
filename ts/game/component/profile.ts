import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, AttributeType, StatType } from 'game/component/api'
import { Stats } from 'game/component/stats'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { CollisionBuffer, RecordType } from 'game/util/collision_buffer'

import { GameGlobals } from 'global/game_globals'

import { settings } from 'settings'

import { Box2 } from 'util/box'
import { Buffer } from 'util/buffer'
import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'
import { Smoother } from 'util/smoother'
import { Vec, Vec2 } from 'util/vector'
import { SmoothVec2 } from 'util/vector/smooth_vector'

type ReadyFn = (profile : Profile) => boolean;
type BodyFn = (profile : Profile) => MATTER.Body;
type OnBodyFn = (profile : Profile) => void;
type PhysicsFn = (profile : Profile) => void;

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

type LimitFn = (profile : Profile) => void;

enum RenderMode {
	UNKNOWN,

	ALWAYS,
	NEVER,
	CHECK_OCCLUSION,
}

export class Profile extends ComponentBase implements Component {

	private static readonly _minQuantization = 1e-3;
	private static readonly _vecEpsilon = 3 * Profile._minQuantization;
	private static readonly _degradedVecEpsilon = 10 * Profile._vecEpsilon;
	private static readonly _angleEpsilon = 1e-1;

	private _degraded : boolean;
	private _bodyFn : BodyFn;
	private _onBodyFns : Array<OnBodyFn>;
	private _readyFn : ReadyFn;
	private _prePhysicsFn : PhysicsFn;
	private _postPhysicsFn : PhysicsFn;

	private _applyScaling : boolean;
	private _collisionBuffer : CollisionBuffer;
	private _constraints : Map<number, MATTER.Constraint>;
	private _forces : Buffer<Vec>;
	private _limitFn : LimitFn;
	private _tempLimitFns : Map<number, LimitFn>;
	private _smoother : Smoother;
	private _scaleFactor : Vec2;
	private _renderMode : RenderMode;

	private _pos : SmoothVec2;
	private _vel : SmoothVec2;
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
		this._collisionBuffer = new CollisionBuffer();
		this._constraints = new Map();
		this._forces = new Buffer();
		this._limitFn = () => {};
		this._tempLimitFns = new Map();
		this._scaleFactor = Vec2.one();
		this._smoother = new Smoother();
		this._renderMode = RenderMode.ALWAYS;

		if (profileOptions.init) {
			this.initFromOptions(profileOptions.init);
		}

		this._body = null;

		this.addProp<Vec>({
			has: () => { return this.hasPos(); },
			export: () => {return this.pos().toVec(); },
			import: (obj : Vec) => {
				this.setPos(obj);
				this.pos().setBase(obj);
			},
			options: {
				filters: GameData.udpFilters,
				equals: (a : Vec, b : Vec) => {
					return Vec2.approxEquals(a, b, this.vecEpsilon());
				},
			},
		});
		this.addProp<Vec>({
			has: () => { return this.hasVel(); },
			export: () => { return this.vel().toVec(); },
			import: (obj : Vec) => {
				this.setVel(obj);
				this.vel().setBase(obj);
			},
			options: {
				filters: GameData.udpFilters,
				equals: (a : Vec, b : Vec) => {
					return Vec2.approxEquals(a, b, this.vecEpsilon());
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
		MATTER.Body.setPosition(this._body, this.pos());

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
				MATTER.Body.setPosition(profile.body(), { x: this.pos().x, y: game.level().bounds().min.y - 10 });
			} else {
				MATTER.Body.setPosition(profile.body(), this.pos());
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

	override processComponent<T extends Component>(component : T) : void {
		if (component.type() !== ComponentType.STATS || !(component instanceof Stats)) {
			return;
		}

		let stats = <Stats>component;
		if (stats.hasStat(StatType.SCALING)) {
			const scaling = stats.getStat(StatType.SCALING).getCurrent();
			this.setScaling({x: scaling, y: scaling });
		}
	}

	relativePos(cardinal : CardinalDir, objectDim : Vec) : Vec2 {
		let adjustedPos = this.pos().clone();
		const dim = this.scaledDim();

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
	createRelativeInit(cardinal : CardinalDir, objectDim : Vec) : ProfileInitOptions {
		return {
			pos: this.relativePos(cardinal, objectDim),
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
	setRenderAlways() : void { this.setRenderMode(RenderMode.ALWAYS); }
	setRenderUnoccluded() : void { this.setRenderMode(RenderMode.CHECK_OCCLUSION); }
	setRenderNever() : void { this.setRenderMode(RenderMode.NEVER); }
	private setRenderMode(mode : RenderMode) : void {
		if (this._renderMode === mode) {
			return;
		}

		this._renderMode = mode;
		switch (mode) {
			case RenderMode.ALWAYS:
			case RenderMode.CHECK_OCCLUSION:
				this.onBody((profile : Profile) => {
					profile.body().render.visible = true;
				});
				break;
			case RenderMode.NEVER:
				this.onBody((profile : Profile) => {
					profile.body().render.visible = false;
				});
				break;
		}
	}

	collisionBuffer() : CollisionBuffer { return this._collisionBuffer; }

	addConstraint(constraint : MATTER.Constraint) : [MATTER.Constraint, number] {
		const id = this._constraints.size + 1;
		MATTER.Composite.add(game.physics().world(), constraint);
		this._constraints.set(id, constraint);
		return [constraint, id];
	}
	deleteConstraint(id : number) : void {
		if (!this._constraints.has(id)) {
			console.error("Error: trying to delete nonexistent constraint", id);
			return;
		}
		MATTER.World.remove(game.physics().world(), this._constraints.get(id));
	}

	private hasPos() : boolean { return defined(this._pos); }
	pos() : SmoothVec2 { return this._pos; }
	getRenderPos() : Vec2 {
		let renderPos = this.pos().clone();
		const bounds = game.level().bounds();
		const target = game.lakitu().target();
		if (this.pos().x - target.x > bounds.width() / 2) {
			renderPos.x -= bounds.width();
		} else if (target.x - this.pos().x > bounds.width() / 2) {
			renderPos.x += bounds.width();
		}
		return renderPos;
	}
	setPos(vec : Vec) : void {
		if (!this.hasPos()) { this._pos = SmoothVec2.zero(); }

		this._pos.copyVec(vec);
		this._pos.roundToEpsilon(Profile._minQuantization);
	}

	hasVel() : boolean { return defined(this._vel); }
	vel() : SmoothVec2 { return this.hasVel() ? this._vel : SmoothVec2.zero(); }
	setVel(vec : Vec) : void {
		if (!this.hasVel()) { this._vel = SmoothVec2.zero(); }

		this._vel.copyVec(vec);
		this._vel.zeroEpsilon(Profile._minQuantization);
		this._vel.roundToEpsilon(Profile._minQuantization);
	}
	addVel(delta : Vec) : void {
		if (!this.hasVel()) { this._vel = SmoothVec2.zero(); }

		this._vel.add(delta);
	}
	capSpeed(speed : number) : void {
		if (!this.hasVel()) {
			this._vel = SmoothVec2.zero();
			return;
		}

		if (this._vel.lengthSq() > speed * speed) {
			this._vel.normalize().scale(speed);
		}
	}

	hasAcc() : boolean { return defined(this._acc); }
	acc() : Vec2 { return this.hasAcc() ? this._acc : Vec2.zero(); }
	setAcc(vec : Vec) : void {
		if (!this.hasAcc()) { this._acc = Vec2.zero(); }

		this._acc.copyVec(vec);
		this._acc.zeroEpsilon(Profile._minQuantization);
		this._acc.roundToEpsilon(Profile._minQuantization);
	}

	private hasDim() : boolean { return defined(this._dim); }
	unscaledDim() : Vec2 { return this._dim; }
	width() : number { return this.scaledDim().x; }
	height() : number { return this.scaledDim().y; }
	scaledDim() : Vec2 { return this.hasScaling() ? this.unscaledDim().clone().mult(this.scaling()) : this.unscaledDim(); }
	setDim(vec : Vec) : void {
		if (defined(this._dim) && Vec2.approxEquals(this._dim.toVec(), vec, this.vecEpsilon())) { return; }
		if (this.hasDim()) {
			console.error("Error: dimension is already initialized for", this.name());
			return;
		}
		this._dim = Vec2.fromVec(vec);
	}

	hasAngle() : boolean { return defined(this._angle); }
	angle() : number { return this.hasAngle() ? this._angle : 0; }
	setAngle(angle : number) : void { this._angle = angle; }
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

		if (point.x > this._pos.x + this._dim.x / 2 + buffer) { return false; }
		if (point.x < this._pos.x - this._dim.x / 2 - buffer) { return false; }
		if (point.y > this._pos.y + this._dim.y / 2 + buffer) { return false; }
		if (point.y < this._pos.y - this._dim.y / 2 - buffer) { return false; }

		return true;
	}
	containsProfile(profile : Profile, buffer? : number) : boolean {
		if (!buffer) {
			buffer = 0;
		}

		if (profile.pos().x + profile.scaledDim().x / 2 > this._pos.x + this._dim.x / 2 + buffer) { return false; }
		if (profile.pos().x - profile.scaledDim().x / 2 < this._pos.x - this._dim.x / 2 - buffer) { return false; }
		if (profile.pos().y + profile.scaledDim().y / 2 > this._pos.y + this._dim.y / 2 + buffer) { return false; }
		if (profile.pos().y - profile.scaledDim().y / 2 < this._pos.y - this._dim.y / 2 - buffer) { return false; }

		return true;
	}
	moveTo(point : Vec, params : MoveToParams) : void {
		if (params.millis <= 0) { return; }

		if (game.level().isCircle()) {
			if (this.pos().x - point.x > game.level().bounds().width() / 2) {
				point.x += game.level().bounds().width();
			} else if (point.x - this.pos().x > game.level().bounds().width() / 2) {
				point.x -= game.level().bounds().width();
			}
		} else {
			game.level().clampPos(point);
		}

		const dt = params.millis / 1000;
		const distVec = this.pos().clone().sub(point).negate();
		if (this._vel.length() * dt >= distVec.length() || distVec.length() < params.posEpsilon) {
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
		this.addVel({
			x: totalForce.x / this._body.mass,
			y: totalForce.y / this._body.mass,
		})
		this._forces.clear();
	}

	private vecEpsilon() : number { return this._degraded ? Profile._degradedVecEpsilon : Profile._vecEpsilon; }
	setLimitFn(limitFn : LimitFn) { this._limitFn = limitFn; }
	addTempLimitFn(limitFn : LimitFn) : number {
		const index = this._tempLimitFns.size + 1;
		this._tempLimitFns.set(index, limitFn);
		return index;
	}
	deleteTempLimitFn(index : number) : void { this._tempLimitFns.delete(index); }
	clearTempLimitFns() : void { this._tempLimitFns.clear(); }
	private applyLimits() : void {
		if (this.hasVel()) {
			this.vel().zeroEpsilon(Profile._minQuantization);
		}
		game.level().clampPos(this.pos());

		this._limitFn(this);
		this._tempLimitFns.forEach((fn : LimitFn) => {
			fn(this);
		});
	}

	override prePhysics(stepData : StepData) : void {
		// super.prePhysics() called later

		const millis = stepData.millis;

		if (this._prePhysicsFn) {
			this._prePhysicsFn(this);
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

		let weight = 0;
		if (settings.predictionTime() > 0) {
			this._smoother.setDiff(game.runner().seqNumDiff());
			weight = this._smoother.weight();
		}
		this.vel().snap(weight);
		if (this.pos().snapDistSq(weight) > 1) {
			this.pos().snap(0);
		} else {
			this.pos().snap(weight);
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

		this.applyForces();
		this.applyLimits();
		if (this.hasVel()) {
			MATTER.Body.setVelocity(this._body, this.vel());
		}

		MATTER.Body.setPosition(this._body, this.pos());

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
		if (other.getAttribute(AttributeType.SOLID) && otherProfile.body().isStatic) {
			let overlap = this.pos().clone().sub(otherProfile.pos()).abs().sub({
				x: this.scaledDim().x / 2 + otherProfile.scaledDim().x / 2,
				y: this.scaledDim().y / 2 + otherProfile.scaledDim().y / 2,
			}).mult({
				x: 1 / this.scaledDim().x,
				y: 1 / this.scaledDim().y,
			});

			let vel = this.vel();
			const yCollision = Math.abs(overlap.x * vel.y) >= Math.abs(overlap.y * vel.x);
			if (yCollision) {
				pen.x = 0;
				normal.x = 0;
				normal.y = Math.sign(normal.y);

				if (Math.sign(vel.y) === Math.sign(this.pos().y - otherProfile.pos().y)) {
					// Moving away from the collision
					pen.scale(0);
					fixed = true;
				} else if (Math.abs(overlap.x) < 0.04 || Math.abs(normal.x) > 0.99) {
					// Either overlap in other dimension is too small or collision direction is in disagreement.
					pen.scale(0);
					fixed = true;
				}
			} else {
				pen.y = 0;
				normal.x = Math.sign(normal.x);
				normal.y = 0;

				if (Math.sign(vel.x) === Math.sign(this.pos().x - otherProfile.pos().x)) {
					// Moving away from the collision
					pen.scale(0);
					fixed = true;
				} if (Math.abs(overlap.y) < 0.04 || Math.abs(normal.y) > 0.99) {
					// Either overlap in other dimension is too small or collision direction is in disagreement.
					pen.scale(0);
					fixed = true;
				}
			}

			if (other.allTypes().has(EntityType.FLOOR)) {
				if (Math.abs(normal.x) > 0 || Math.abs(pen.x) > 0) {
					pen.x = 0;
					normal.x = 0;
					normal.y = Math.sign(normal.y);
					fixed = true;
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
		if (this._collisionBuffer.hasRecords() && this._collisionBuffer.fixed()) {
			{
				const record = this._collisionBuffer.record(RecordType.MAX_PEN_X);
				if (record.collision.penetration.x <= 0 && this.vel().x > 0) {
					MATTER.Body.setVelocity(this._body, {
						x: this.vel().x,
						y: this._body.velocity.y,
					});
					MATTER.Body.setPosition(this._body, {
						x: this._body.position.x + this.vel().x * millis / 1000,
						y: this._body.position.y,
					});
				}
			}
			{
				const record = this._collisionBuffer.record(RecordType.MIN_PEN_X);
				if (record.collision.penetration.x >= 0 && this.vel().x < 0) {
					MATTER.Body.setVelocity(this._body, {
						x: this.vel().x,
						y: this._body.velocity.y,
					});
					MATTER.Body.setPosition(this._body, {
						x: this._body.position.x + this.vel().x * millis / 1000,
						y: this._body.position.y,
					});
				}
			}

			{
				const record = this._collisionBuffer.record(RecordType.MAX_PEN_Y);
				if (record.collision.penetration.y <= 0 && this.vel().y > 0) {
					MATTER.Body.setVelocity(this._body, {
						x: this._body.velocity.x,
						y: this.vel().y,
					});
					MATTER.Body.setPosition(this._body, {
						x: this._body.position.x,
						y: this._body.position.y + this.vel().y * millis / 1000,
					});
				}
			}

			{
				const record = this._collisionBuffer.record(RecordType.MIN_PEN_Y);
				if (record.collision.penetration.y >= 0 && this.vel().y < 0) {
					MATTER.Body.setVelocity(this._body, {
						x: this._body.velocity.x,
						y: this.vel().y,
					});
					MATTER.Body.setPosition(this._body, {
						x: this._body.position.x,
						y: this._body.position.y + this.vel().y * millis / 1000,
					});
				}
			}
		}

		if (this._postPhysicsFn) {
			this._postPhysicsFn(this);
		} 
		
		if (this.hasAngle()) {
			this.setAngle(this._body.angle);
		}
		if (this.hasVel()) {
			this.setVel(this._body.velocity);

			if (!this.isSource()) {
				this._vel.setPredict(this._body.velocity);
			}
		}

		this.setPos(this._body.position);
		if (!this.isSource()) {
			this._pos.setPredict(this._body.position);
		}

		// Update child objects afterwards.
		super.postPhysics(stepData);
	}

	override preRender() : void {
		super.preRender();

		// Wrap the object for visualization if we're in a circle level
		// Putting this here introduces some minimap flicker since MATTER.Render is synced with RequestAnimationFrame, not render()
		if (game.level().isCircle()) {
			MATTER.Body.setPosition(this._body, this.getRenderPos());
		}

		if (this._renderMode === RenderMode.CHECK_OCCLUSION) {
			this._body.render.visible = !this.entity().getAttribute(AttributeType.OCCLUDED);
		}
	}
} 