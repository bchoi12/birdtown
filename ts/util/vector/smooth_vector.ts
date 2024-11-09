
import { Optional } from 'util/optional'
import { Vec, Vec2, Vec3 } from 'util/vector'

export class SmoothVec extends Vec3 {

	private _base : Optional<Vec2>;
	private _predict : Optional<Vec2>;

	constructor(vec : Vec) {
		super(vec);

		this._base = new Optional();
		this._predict = new Optional();
	}

	static zero() : SmoothVec { return new SmoothVec({x: 0, y: 0, z: 0}); }

	override clone() : SmoothVec {
		const sv = new SmoothVec(this);
		if (this._base.has()) {
			sv.setBase(this._base.get());
		}
		if (this._predict.has()) {
			sv.setPredict(this._predict.get());
		}
		return sv;
	}

	setBase(vec : Vec) : void {
		if (!this._base.has()) {
			this._base.set(Vec3.zero());
		}
		this._base.get().copyVec(vec);
	}
	setPredict(vec : Vec) : void {
		if (!this._predict.has()) {
			this._predict.set(Vec3.zero());
		}
		this._predict.get().copyVec(vec);
	}

	snapDistSq(weight : number) : number {
		let temp = this.clone();
		temp.snap(weight)

		return this.distSq(temp);
	}

	snap(t : number) : Vec3 {
		if (!this._base.has() || !this._predict.has()) { return this; }

		this.copyVec(this._base.get());
		return this.lerp(this._predict.get(), t);
	}
	peek(t : number) : Vec3 {
		if (!this._base.has() || !this._predict.has()) { return this; }

		let vec = this.clone().copyVec(this._base.get());
		return vec.lerp(this._predict.get(), t);
	}
}