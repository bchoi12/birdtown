
import { Vec, Vec2 } from 'util/vector'

export class SmoothVec2 extends Vec2 {

	private _offset : Vec2;

	constructor(vec : Vec) {
		super(vec);

		this._offset = Vec2.zero();
	}

	static zero() : SmoothVec2 { return new SmoothVec2({x: 0, y: 0}); }

	override clone() : SmoothVec2 {
		let sv = new SmoothVec2(this);
		sv.setOffset(this.offset());
		return sv;
	}

	offset() : Vec2 { return this._offset; }
	setOffset(vec : Vec) : void { this._offset.copyVec(vec); }

	peek(t : number) : SmoothVec2 {
		let sv = this.clone();
		sv.add(this._offset.clone().scale(t));
		return sv;
	}

	snap(t : number) : SmoothVec2 {
		this.lerp(this._offset.add(this), t);
		this._offset.scale(1 - t);
		return this;
	}
}