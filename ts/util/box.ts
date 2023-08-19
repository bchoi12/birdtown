
import { Vec, Vec2 } from 'util/vector'


export class Box2 {
	
	private _min : Vec2;
	private _max : Vec2;

	constructor(min : Vec, max : Vec) {
		this._min = Vec2.fromVec(min);
		this._max = Vec2.fromVec(max);
	}

	contains(point : Vec) : boolean{
		return this._min.x <= point.x && this._min.y <= point.y && this._max.x >= point.x && this._max.y >= point.y;
	}

	clamp(result : Vec2) : void {
		result.x = Math.min(this._max.x, Math.max(this._min.x, result.x));
		result.y = Math.min(this._max.y, Math.max(this._min.y, result.y));
	}
}