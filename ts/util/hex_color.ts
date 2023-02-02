import * as BABYLON from 'babylonjs'

export class HexColor {
	private _hex : number;
	private _r : number;
	private _g : number;
	private _b : number;

	constructor(hex : number) {
		this.computeColor(hex);
	}

	static fromObject(obj : Object) : HexColor { return new HexColor(<number>obj); }

	toString() : string { return "#" + this._hex.toString(16).padStart(6, "0"); }
	toObject() : Object { return this._hex; }
	toBabylonColor3() : BABYLON.Color3 { return new BABYLON.Color3(this._r / 0xff, this._g / 0xff, this._b / 0xff); }
	copyObject(obj : Object) : void { this.computeColor(<number>obj); }

	private computeColor(hex : number) {
		this._hex = this.clampColor(hex);
		this._r = this.computeRed(this._hex);
		this._g = this.computeGreen(this._hex);
		this._b = this.computeBlue(this._hex);
	}
	private computeRed(hex : number) : number { return (hex >> 16) & 0xff; }
	private computeGreen(hex : number) : number { return (hex >> 8) & 0xff; }
	private computeBlue(hex : number) : number { return hex & 0xff; }

	private clampColor(hex : number) : number {
		if (hex > 0xffffff) {
			return 0xffffff;
		} else if (hex < 0) {
			return 0;
		}
		return hex;
	}

	private clampPrimary(primary : number) : number {
		if (primary > 0xff) {
			return 0xff;
		} else if (primary < 0) {
			return 0;
		}
		return primary;
	}
}