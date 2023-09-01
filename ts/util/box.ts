
import { Vec, Vec2 } from 'util/vector'

enum Prop {
	UNKNOWN,
	MIN,
	MAX,
}

export class Box2 {
	
	private _min : Vec2;
	private _max : Vec2;

	constructor(min : Vec, max : Vec) {
		this._min = Vec2.fromVec(min);
		this._max = Vec2.fromVec(max);
	}

	static zero() : Box2 { return new Box2(Vec2.zero(), Vec2.zero()); }

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

	toObject() : Object {
		let obj = {};
		obj[Prop.MIN] = this._min.toObject();
		obj[Prop.MAX] = this._max.toObject();
		return obj;
	}
	copyObject(obj : Object) : void {
		if (obj.hasOwnProperty(Prop.MIN)) {
			this._min.copyVec(obj[Prop.MIN]);
		}
		if (obj.hasOwnProperty(Prop.MAX)) {
			this._max.copyVec(obj[Prop.MAX]);
		}
	}
}