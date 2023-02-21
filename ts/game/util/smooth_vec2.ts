
import { Funcs } from 'util/funcs'
import { Vec, Vec2 } from 'util/vector'

export class SmoothVec2 {
	
	private static readonly _interval = 0.01;

	private _base : Vec2;
	private _direction : Vec2;
	private _prediction : Vec2;

	private _weight : Vec2;

	constructor() {
		this._base = Vec2.zero();
		this._direction = Vec2.i();
		this._prediction = Vec2.zero();

		this._weight = Vec2.zero();;
	}

	setBase(vec : Vec) : void {
		this._base.copyVec(vec);
	}

	setDirection(vec : Vec) : void {
		this._direction.copyVec(vec).normalize();
	}

	setPrediction(vec : Vec) : void {
		this._prediction.copyVec(vec);
	}

	updateWeight() : void {
		let dir = this._prediction.clone().sub(this._base).normalize();

		const xProd = this._direction.x === 0 ? 1 : Math.max(0, dir.x * this._direction.x);
		if (xProd > this._weight.x) {
			this._weight.x = Math.min(this._weight.x + SmoothVec2._interval, xProd);
		} else {
			this._weight.x = Math.max(this._weight.x - SmoothVec2._interval, xProd);
		}

		const yProd = this._direction.y === 0 ? 1 : Math.max(0, dir.y * this._direction.y);
		if (yProd > this._weight.y) {
			this._weight.y = Math.min(this._weight.y + SmoothVec2._interval, yProd);
		} else {
			this._weight.y = Math.max(this._weight.y - SmoothVec2._interval, yProd);
		}

		this._weight.clamp(0, 1);
	}

	getVec() : Vec {
		return this._base.toVec();

		/*
		return {
			x: (1 - this._weight.x) * this._base.x + this._weight.x * this._prediction.x,
			y: (1 - this._weight.y) * this._base.y + this._weight.y * this._prediction.y,
		}
		*/
	}

	getVec2() : Vec2 {
		return new Vec2(this.getVec());
	}
}