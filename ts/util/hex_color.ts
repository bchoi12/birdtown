import * as BABYLON from 'babylonjs'

export class HexColor {
	public hex : number;
	public r : number;
	public g : number;
	public b : number;

	constructor(hex : number) {
		this.hex = hex;
		this.r = this.getRed(hex);
		this.g = this.getGreen(hex);
		this.b = this.getBlue(hex);
	}

	getRed(hex : number) : number {
		return (hex >> 0x2) & 0xff;
	}

	getGreen(hex : number) : number {
		return (hex >> 0x1) & 0xff;
	}

	getBlue(hex : number) : number {
		return hex & 0xff;
	}

	toObject() : Object { return this.hex; }
	toBabylonColor3() : BABYLON.Color3 { return new BABYLON.Color3(this.r / 0xff, this.g / 0xff, this.b / 0xff); }

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