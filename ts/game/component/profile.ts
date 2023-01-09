import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Collider, ColliderOptions } from 'game/component/collider'
import { Data, DataFilter, DataMap } from 'game/data'

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
	mainCollider : ColliderOptions;
	init? : ProfileInitOptions
	initFn? : InitFn;
}

enum Prop {
	UNKNOWN,
	MAIN,
}

export class Profile extends ComponentBase implements Component {
	private readonly _numProps = Object.keys(Prop).length;

	private _initFn : InitFn;

	private _collider : Collider;
	private _colliders : Map<number, Collider>;

	private _dataBuffers : Map<number, Data>;
	private _constraints : Map<number, MATTER.Constraint>;

	constructor(profileOptions : ProfileOptions) {
		super(ComponentType.PROFILE);

		this._initFn = defined(profileOptions.initFn) ? profileOptions.initFn : () => {};
		this._collider = new Collider(profileOptions.mainCollider);
		if (profileOptions.init) {
			this.initFromOptions(profileOptions.init);
		}

		this._colliders = new Map();
		this._colliders.set(Prop.MAIN, this._collider);
		this._dataBuffers = new Map();

		this._constraints = new Map();
	}

	initFromOptions(init : ProfileInitOptions) : void {
		if (init.pos) { this.setPos(init.pos); }
		if (init.vel) { this.setVel(init.vel); }
		if (init.acc) { this.setAcc(init.acc); }
		if (init.dim) { this.setDim(init.dim); }
	}

	override ready() : boolean { return this._collider.ready(); }

	override initialize() : void {
		super.initialize();

		this._collider.setEntity(this.entity());
		this._collider.initialize();
		this._initFn(this);
	}

	override delete() : void {
		this._colliders.forEach((collider : Collider) => {
			collider.delete();
		});
	}

	override dispose() : void {
		super.dispose();

		this._colliders.forEach((collider : Collider) => {
			collider.dispose();
		});
		this._constraints.forEach((constraint : MATTER.Constraint) => {
			MATTER.World.remove(game.physics().world, constraint);
		});
	}

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

	stop() : void { this._collider.stop(); }

	pos() : Vec2 { return this._collider.pos(); }
	setPos(vec : Vec) : void { this._collider.setPos(vec); }
	addPos(vec : Vec) : void { this._collider.addPos(vec); }

	hasVel() : boolean { return this._collider.hasVel(); }
	vel() : Vec2 { return this._collider.vel(); }
	setVel(vec : Vec) : void { this._collider.setVel(vec); }
	addVel(vec : Vec) : void { this._collider.addVel(vec); }

	hasAcc() : boolean { return this._collider.hasAcc(); }
	acc() : Vec2 { return this._collider.acc(); }
	setAcc(vec : Vec) : void { this._collider.setAcc(vec); }
	addAcc(vec : Vec) : void { this._collider.addAcc(vec); }

	dim() : Vec2 { return this._collider.dim(); }
	setDim(vec : Vec) : void { this._collider.setDim(vec); }

	hasAngle() : boolean { return this._collider.hasAngle(); }
	angle() : number { return this._collider.angle(); }
	setAngle(angle : number) : void { this._collider.setAngle(angle); }
	addAngle(angle : number) : void { this._collider.addAngle(angle); }
	setAngularVelocity(vel : number) : void { this._collider.setAngularVelocity(vel); }
	addAngularVelocity(vel : number) : void { this._collider.addAngularVelocity(vel); }

	addForce(vec : Vec) : void { this._collider.addForce(vec); }

	hasInertia() : boolean { return this._collider.hasInertia(); }
	inertia() : number { return this._collider.inertia(); }
	setInertia(inertia : number) : void { this._collider.setInertia(inertia); }
	resetInertia() : void { this._collider.resetInertia(); }

	hasScaling() : boolean { return this._collider.hasScaling(); }
	scaling() : Vec2 { return this._collider.scaling(); }
	setScaling(vec : Vec) : void { this._collider.setScaling(vec); }

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		this._colliders.forEach((collider : Collider) => {
			collider.prePhysics(millis);
		});
	}

	override postPhysics(millis : number) : void {
		super.postPhysics(millis);

		this._colliders.forEach((collider : Collider) => {
			collider.postPhysics(millis);
		});
	}

	override dataMap(filter : DataFilter) : DataMap {
		let dataMap = {};

		this._colliders.forEach((collider : Collider, id : number) => {
			const data = collider.dataMap(filter);
			if (Object.keys(data).length > 0) {
				dataMap[id] = data;
			}
		});
		return dataMap;
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		if (!this.shouldBroadcast()) {
			return;
		}

		this._colliders.forEach((collider : Collider, key : number) => {
			collider.updateData(seqNum);
		});
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		const changed = this._data.import(data, seqNum);
		if (changed.size === 0) {
			return;
		}

		changed.forEach((key : number) => {
			if (!this._colliders.has(key)) {
				if (!this._dataBuffers.has(key)) {
					this._dataBuffers.set(key, new Data());
				}
				this._dataBuffers.get(key).import(<DataMap>data[key], seqNum);
				return;
			}

			this._colliders.get(key).importData(<DataMap>data[key], seqNum);
		});
	}
}