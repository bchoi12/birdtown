
import { Vec, Vec3 } from 'util/vector'

export class Recoil {
	
	private _dist : number
	private _rotation : Vec3;
	private _percent : number;

	constructor() {
		this._dist = 0;
		this._rotation = Vec3.zero();
		this._percent = 1;
	}

	dist() : number { return this._dist; }
	rotation() : Vec3 { return this._rotation; }

	setDist(dist : number) : Recoil {
		this._dist = dist;
		return this;
	}

	setRotation(vec : Vec) : Recoil {
		this._rotation.copyVec(vec);
		return this;
	}

	copy(other : Recoil) : void {
		this.setDist(other.dist());
		this.setRotation(other.rotation());
		this._percent = 1;
	}

	recover(percent : number) : void {
		if (this._percent <= 0) {
			return;
		}

		const magicNum = (this._percent - percent) / this._percent;

		this._dist = this._dist * magicNum;
		this._rotation.scale(magicNum);

		this._percent = Math.max(0, this._percent - percent);
	}
}