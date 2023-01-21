import * as BABYLON from 'babylonjs'

export class HexColor {
	public hex : number;
	public r : number;
	public g : number;
	public b : number;

	constructor(hex : number) {
		this.hex = hex;
		this.r = this.computeRed(hex);
		this.g = this.computeGreen(hex);
		this.b = this.computeBlue(hex);
	}

	toString() : string { return "#" + this.hex.toString(16).padStart(6, "0"); }
	toObject() : Object { return this.hex; }
	toBabylonColor3() : BABYLON.Color3 { return new BABYLON.Color3(this.r / 0xff, this.g / 0xff, this.b / 0xff); }

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