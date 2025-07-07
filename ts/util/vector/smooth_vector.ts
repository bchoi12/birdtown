
import { Optional } from 'util/optional'
import { Vec, Vec3 } from 'util/vector'

export class SmoothVec extends Vec3 {

	private _base : Optional<Vec3>;
	private _predict : Optional<Vec3>;

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

	approxSynced() : boolean {
		if (!this._base.has() || !this._predict.has()) { return true; }

		// 3e-2 is a relatively unnoticeable diff in position
		return Vec3.approxEquals(this._base.get(), this._predict.get(), 3e-2);
	}

	snapXY(t : number) : Vec3 {
		const z = this.z;
		this.snap(t);
		this.z = z;
		return this;
	}
	snap(t : number) : Vec3 {
		if (!this._base.has() || !this._predict.has()) { return this; }

		this.copyVec(this._base.get());
		return this.lerp(this._predict.get(), t);
	}
}