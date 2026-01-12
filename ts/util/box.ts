
import { Cardinal, CardinalDir } from 'util/cardinal'
import { Vec, Vec2 } from 'util/vector'

enum Prop {
	UNKNOWN,
	MIN,
	MAX,
}

export interface Box {
	min: Vec;
	max: Vec;
}

export class Box2 implements Box {
	
	public min : Vec2;
	public max : Vec2;

	constructor(min : Vec, max : Vec) {
		this.min = Vec2.fromVec(min);
		this.max = Vec2.fromVec(max);
	}

	static zero() : Box2 { return new Box2(Vec2.zero(), Vec2.zero()); }
	static point(point : Vec) : Box2 { return new Box2(point, point); }
	static fromBox(box : Box) : Box2 { return new Box2(box.min, box.max); }

	width() : number { return this.max.x - this.min.x; }
	height() : number { return this.max.y - this.min.y; }
	dim() : Vec2 { return this.max.clone().sub(this.min); }

	contains(point : Vec, buffer? : number) : boolean {
		return this.xSide(point, buffer) === 0 && this.ySide(point, buffer) === 0;
	}
	xSide(point : Vec, buffer? : number) : number {
		if (!buffer) { buffer = 0; }

		if (point.x < this.min.x - buffer) { return -1; }
		if (point.x > this.max.x + buffer) { return 1; }
		return 0;
	}
	ySide(point : Vec, buffer? : number) : number {
		if (!buffer) { buffer = 0; }
		
		if (point.y < this.min.y - buffer) { return -1; }
		if (point.y > this.max.y + buffer) { return 1; }
		return 0;	
	}

	xRand() : number { return this.min.x + Math.random() * (this.max.x - this.min.x); }
	yRand() : number { return this.min.y + Math.random() * (this.max.y - this.min.y); }

	getCenter() : Vec {
		return {
			x: (this.max.x - this.min.x) / 2,
			y: (this.max.y - this.min.y) / 2,
		}
	}
	getRelativePos(cardinal : CardinalDir) : Vec2 {
		const dim = this.max.clone().sub(this.min);

		let relativePos = this.min.clone().lerp(this.max, 0.5);
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

	add(delta : Vec) : void {
		this.min.sub(delta);
		this.max.add(delta);
	}
	clamp(result : Vec) : void {
		result.x = Math.min(this.max.x, Math.max(this.min.x, result.x));
		result.y = Math.min(this.max.y, Math.max(this.min.y, result.y));
	}

	collapse(point : Vec) : Box2 {
		this.min.copyVec(point);
		this.max.copyVec(point);
		return this;
	}
	stretch(point : Vec, dim : Vec) : Box2 {
		this.min.min({
			x: point.x - dim.x / 2,
			y: point.y - dim.y / 2,
		});
		this.max.max({
			x: point.x + dim.x / 2,
			y: point.y + dim.y / 2,
		});
		return this;
	}

	clone() : Box2 {
		return new Box2(this.min, this.max);
	}
	toBox() : Box {
		return {
			min: this.min.toVec(),
			max: this.max.toVec(),
		}
	}
	copyBox(obj : Box) : void {
		this.min.copyVec(obj.min);
		this.max.copyVec(obj.max);
	}
	copyBox2(box : Box2) : void {
		this.min.copyVec(box.min);
		this.max.copyVec(box.max);
	}
}