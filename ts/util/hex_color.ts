import * as BABYLON from '@babylonjs/core/Legacy/legacy'

export class HexColor {
	private _hex : number;
	private _r : number;
	private _g : number;
	private _b : number;

	private constructor(hex : number) {
		this._hex = hex;
		this.computeRGB();
	}

	static fromHex(hex : number) : HexColor { return new HexColor(hex); }
	static fromRGB(r : number, g : number, b : number) { return HexColor.fromHex(HexColor.rgbToHex(r, g, b)); }
	static white() : HexColor { return new HexColor(0xffffff); }
	static black() : HexColor { return new HexColor(0x000000); }

	static hexToRGB(hex : number) : [number, number, number] {
		hex = HexColor.clampHex(hex);
		return [
			(hex >> 16) & 0xff,
			(hex >> 8) & 0xff,
			hex & 0xff,
		];
	}
	static rgbToHex(r : number, g : number, b : number) : number {
		r = HexColor.clampPrimary(r);
		g = HexColor.clampPrimary(g);
		b = HexColor.clampPrimary(b);
		return (r << 16) + (g << 8) + b;
	}

	clone() : HexColor { return HexColor.fromHex(this._hex); }

	toString() : string { return "#" + this._hex.toString(16).padStart(6, "0"); }
	toHex() : number { return this._hex; }
	toBabylonColor3() : BABYLON.Color3 { return new BABYLON.Color3(this._r / 0xff, this._g / 0xff, this._b / 0xff); }

	copyHex(value : number) : void { this._hex = HexColor.clampHex(<number>value); }
	copyRGB(r : number, g : number, b : number) : void {
		this._r = HexColor.clampPrimary(r);
		this._g = HexColor.clampPrimary(g);
		this._b = HexColor.clampPrimary(b);

		this.computeHex();
	}

	add(delta : number) : HexColor {
		this._hex = HexColor.clampHex(this._hex + delta);
		this.computeRGB();
		return this;
	}
	sub(delta : number) : HexColor { return this.add(-delta); }
	mult(scalar : number) : HexColor {
		this._r = HexColor.clampPrimary(scalar * this._r);
		this._g = HexColor.clampPrimary(scalar * this._g);
		this._b = HexColor.clampPrimary(scalar * this._b);
		this.computeHex();
		return this;
	}

	private computeHex() : void {
		this._hex = (this._r << 16) + (this._g << 8) + this._b;
	}

	private computeRGB() {
		this._r = (this._hex >> 16) & 0xff;
		this._g = (this._hex >> 8) & 0xff;
		this._b = this._hex & 0xff;
	}

	private static clampHex(hex : number) : number {
		hex = Math.floor(hex);

		if (hex > 0xffffff) {
			return 0xffffff;
		} else if (hex < 0) {
			return 0;
		}
		return hex;
	}

	private static clampPrimary(primary : number) : number {
		primary = Math.floor(primary);

		if (primary > 0xff) {
			return 0xff;
		} else if (primary < 0) {
			return 0;
		}
		return primary;
	}
}