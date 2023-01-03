
import { Data, DataFilter, DataMap } from 'game/data'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

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

export class ProfilePart {
	private _name : string;
	private _forces : Array<Vec>;

	private _pos : Vec2;
	private _vel : Vec2;
	private _acc : Vec2;
	private _dim : Vec2;
	private _angle : number;
	private _inertia : number;
	private _scaling : Vec2;

	constructor(name : string) {
		this._name = name;
		this._forces = new Array();
	}

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
		if (Data.equals(this._dim.toVec(), vec)) { return; }
		if (this.hasDim()) {
			console.error("Error: dimension is already initialized for " + name);
			return;
		}
		this._dim.copyVec(vec);
	}

	hasAngle() : boolean { return defined(this._angle); }
	angle() : number { return this._angle; }
	setAngle(angle : number) : void { this._angle = angle; }
	addAngle(delta : number) : void { this._angle += delta; }

	addForce(force : Vec) : void { this._forces.push(force); }
	protected applyForces() : void {
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

	hasScaling() : boolean { return defined(this._scaling) && defined(this._scaling.x, this._scaling.y); }
	scaling() : Vec2 { return this._scaling; }
	setScaling(vec : Vec) {
		if (!defined(this._scaling)) {
			this._scaling = Vec2.fromVec(vec);
			return;
		}
		
		if (Data.equals(this._scaling, vec)) { return; }

		this._scaling.copyVec(vec);
	}
}