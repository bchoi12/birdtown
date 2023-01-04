import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Body, BodyInitOptions, BodyOptions } from 'game/component/body'
import { Data, DataFilter, DataMap } from 'game/data'

import { options } from 'options'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

type ReadyFn = (profile : Profile) => boolean;
type InitFn = (profile : Profile) => void;
type OnInitFn = (profile : Profile) => void;

export type ProfileInitOptions = {
}

export type ProfileOptions = {
	readyFn? : ReadyFn;
	initFn? : InitFn;

	bodyOptions : BodyOptions;
	initOptions? : ProfileInitOptions;
}

enum Prop {
	UNKNOWN,
	MAIN,
}

export class Profile extends ComponentBase implements Component {
	private readonly _numProps = Object.keys(Prop).length;

	private _readyFn : ReadyFn;
	private _initFn : InitFn;
	private _body : Body;
	private _bodies : Map<number, Body>;
	private _dataBuffers : Map<number, Data>;
	private _constraints : Map<number, MATTER.Constraint>;

	constructor(profileOptions : ProfileOptions) {
		super(ComponentType.PROFILE);

		this._readyFn = defined(profileOptions.readyFn) ? profileOptions.readyFn : () => { return true; };
		this._initFn = defined(profileOptions.initFn) ? profileOptions.initFn : () => {};
		this._body = new Body(profileOptions.bodyOptions);

		this._bodies = new Map();
		this._bodies.set(Prop.MAIN, this._body);
		this._dataBuffers = new Map();

		this._constraints = new Map();
	}

	override ready() : boolean { return this._body.ready() && this._readyFn(this); }

	override initialize() : void {
		super.initialize();

		this._body.setEntity(this.entity());
		this._body.initialize();
		this._initFn(this);
	}

	override delete() : void {
		this._bodies.forEach((body : Body) => {
			body.delete();
		});
	}

	override dispose() : void {
		super.dispose();

		this._bodies.forEach((body : Body) => {
			body.dispose();
		});
		this._constraints.forEach((constraint : MATTER.Constraint) => {
			MATTER.World.remove(game.physics().world, constraint);
		});
	}

	addBody(inputKey : number, body : Body) : Body {
		const key = this._numProps + inputKey;

		if (this._bodies.has(key)) {
			console.error("Error: trying to add body with duplicate key", inputKey, body);
			return;
		}

		body.setEntity(this.entity());
		if (this._dataBuffers.has(key)) {
			body.data().copy(this._dataBuffers.get(key));
		}
		body.initialize();
		this._bodies.set(key, body);
		return body;
	}
	body(key? : number) : Body {
		if (!defined(key)) { 
			return this._body;
		}

		return this._bodies.get(this._numProps + key);
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

	stop() : void { this._body.stop(); }

	pos() : Vec2 { return this._body.pos(); }
	setPos(vec : Vec) : void { this._body.setPos(vec); }
	addPos(vec : Vec) : void { this._body.addPos(vec); }

	hasVel() : boolean { return this._body.hasVel(); }
	vel() : Vec2 { return this._body.vel(); }
	setVel(vec : Vec) : void { this._body.setVel(vec); }
	addVel(vec : Vec) : void { this._body.addVel(vec); }

	hasAcc() : boolean { return this._body.hasAcc(); }
	acc() : Vec2 { return this._body.acc(); }
	setAcc(vec : Vec) : void { this._body.setAcc(vec); }
	addAcc(vec : Vec) : void { this._body.addAcc(vec); }

	dim() : Vec2 { return this._body.dim(); }
	setDim(vec : Vec) : void { this._body.setDim(vec); }

	hasAngle() : boolean { return this._body.hasAngle(); }
	angle() : number { return this._body.angle(); }
	setAngle(angle : number) : void { this._body.setAngle(angle); }
	addAngle(angle : number) : void { this._body.addAngle(angle); }
	setAngularVelocity(vel : number) : void { this._body.setAngularVelocity(vel); }
	addAngularVelocity(vel : number) : void { this._body.addAngularVelocity(vel); }

	addForce(vec : Vec) : void { this._body.addForce(vec); }

	hasInertia() : boolean { return this._body.hasInertia(); }
	inertia() : number { return this._body.inertia(); }
	setInertia(inertia : number) : void { this._body.setInertia(inertia); }
	resetInertia() : void { this._body.resetInertia(); }

	hasScaling() : boolean { return this._body.hasScaling(); }
	scaling() : Vec2 { return this._body.scaling(); }
	setScaling(vec : Vec) : void { this._body.setScaling(vec); }

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		this._bodies.forEach((body : Body) => {
			body.prePhysics(millis);
		});
	}

	override postPhysics(millis : number) : void {
		super.postPhysics(millis);

		this._bodies.forEach((body : Body) => {
			body.postPhysics(millis);
		});
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this._bodies.forEach((body : Body, key : number) => {
			body.updateData(seqNum);
			this.setProp(key, body.data(), seqNum);
		});
	}

	override mergeData(data : DataMap, seqNum : number) : void {
		super.mergeData(data, seqNum);

		const changed = this._data.merge(data, seqNum);
		if (changed.size === 0) {
			return;
		}

		changed.forEach((key : number) => {
			if (!this._bodies.has(key)) {
				if (!this._dataBuffers.has(key)) {
					this._dataBuffers.set(key, new Data());
				}
				this._dataBuffers.get(key).merge(<DataMap>data[key], seqNum);
				return;
			}

			this._bodies.get(key).mergeData(<DataMap>data[key], seqNum);
		});
	}
}