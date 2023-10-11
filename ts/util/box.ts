
import { Cardinal, CardinalDir } from 'util/cardinal'
import { Vec, Vec2 } from 'util/vector'

enum Prop {
	UNKNOWN,
	MIN,
	MAX,
}

export interface Box {
	a: Vec;
	b: Vec;
}

export class Box2 {
	
	private _min : Vec2;
	private _max : Vec2;

	constructor(min : Vec, max : Vec) {
		this._min = Vec2.fromVec(min);
		this._max = Vec2.fromVec(max);
	}

	static zero() : Box2 { return new Box2(Vec2.zero(), Vec2.zero()); }
	static point(point : Vec) : Box2 { return new Box2(point, point); }

	contains(point : Vec) : boolean {
		return this.xSide(point) === 0 && this.ySide(point) === 0;
	}
	xSide(point : Vec) : number {
		if (point.x < this._min.x) { return -1; }
		if (point.x > this._max.x) { return 1; }
		return 0;
	}
	ySide(point : Vec) : number {
		if (point.y < this._min.y) { return -1; }
		if (point.y > this._max.y) { return 1; }
		return 0;	
	}
	relativePos(cardinal : CardinalDir) : Vec2 {
		const dim = this._max.clone().sub(this._min);

		let relativePos = this._min.clone().lerp(this._max, 0.5);
		if (Cardinal.isLeft(cardinal)) {
			relativePos.add({ x: -dim.x / 2 });
		} else if (Cardinal.isRight(cardinal)) {
			relativePos.add({ x: dim.x / 2 });
		}

		if (Cardinal.isTop(cardinal)) {
			relativePos.add({ y: dim.y / 2 });
		} else if (Cardinal.isBottom(cardinal)) {
			relativePos.add({ y: -dim.y / 2 });
		}
		return relativePos;
	}

	add(delta : Vec2) : void {
		this._min.sub(delta);
		this._max.add(delta);
	}
	clamp(result : Vec2) : void {
		result.x = Math.min(this._max.x, Math.max(this._min.x, result.x));
		result.y = Math.min(this._max.y, Math.max(this._min.y, result.y));
	}

	collapse(point : Vec) : Box2 {
		this._min.copyVec(point);
		this._max.copyVec(point);
		return this;
	}
	stretch(point : Vec) : Box2 {
		this._min.min(point);
		this._max.max(point);
		return this;
	}

	toBox() : Box {
		return {
			a: this._min.toVec(),
			b: this._max.toVec(),
		}
	}
	copyBox(obj : Box) : void {
		this._min.copyVec(obj.a);
		this._max.copyVec(obj.b);
	}
}