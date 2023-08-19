
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

export class SmoothVec2 extends Vec2 {

	private _base : Optional<Vec2>;
	private _predict : Optional<Vec2>;

	constructor(vec : Vec) {
		super(vec);

		this._base = new Optional();
		this._predict = new Optional();
	}

	static zero() : SmoothVec2 { return new SmoothVec2({x: 0, y: 0}); }

	override clone() : SmoothVec2 {
		const sv = new SmoothVec2(this);
		if (this._base.has()) {
			sv.setBase(this._base.get());
		}
		if (this._predict.has()) {
			sv.setPredict(this._predict.get());
		}
		return sv;
	}

	setBase(vec : Vec) : void { this._base.set(Vec2.fromVec(vec)); }
	setPredict(vec : Vec) : void { this._predict.set(Vec2.fromVec(vec)); }

	snap(t : number) : Vec2 {
		if (!this._base.has() || !this._predict.has()) { return this; }

		this.copyVec(this._base.get());
		return this.lerp(this._predict.get(), t);
	}
	peek(t : number) : Vec2 {
		if (!this._base.has() || !this._predict.has()) { return this; }

		let vec = this.clone().copyVec(this._base.get());
		return vec.lerp(this._predict.get(), t);
	}
}