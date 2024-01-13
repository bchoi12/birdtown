
import { ColorType } from 'game/factory/api'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'

import { defined } from 'util/common'
import { HexColor } from 'util/hex_color'
import { Optional } from 'util/optional'

export type HexColorsInitOptions = {
	color? : HexColor;
	colors? : Map<ColorType, HexColor>;
}

export class HexColors extends ComponentBase implements Component {

	private _mainColor : Optional<HexColor>;
	private _colors : Map<ColorType, HexColor>;

	constructor(init? : HexColorsInitOptions) {
		super(ComponentType.HEX_COLORS);

		if (!defined(init)) { init = {}; }

		this._mainColor = new Optional(); 
		if (init.color) {
			this.setMainColor(init.color.toHex());
		}

		this._colors = new Map();
		if (init.colors) {
			init.colors.forEach((color : HexColor, type : ColorType) => {
				this.setColor(type, color.toHex());
			});
		}

		this.addProp<number>({
			has: () => { return this._mainColor.has(); },
			export: () => { return this._mainColor.get().toHex(); },
			import: (obj : number) => { this.setMainColor(obj); },
		})

		for (const stringColor in ColorType) {
			const color = Number(ColorType[stringColor]);
			if (Number.isNaN(color) || color <= 0) {
				continue;
			}

			this.addProp<number>({
				has: () => { return this._colors.has(color); },
				export: () => { return this._colors.get(color).toHex(); },
				import: (obj : number) => { this.setColor(color, obj); },
			})
		}
	}

	setMainColor(hex : number) {
		if (!this._mainColor.has()) {
			this._mainColor.set(HexColor.fromHex(hex));
		} else {
			this._mainColor.get().copyHex(hex);
		}
	}
	hasMainColor() : boolean { return this._mainColor.has(); }
	mainColor() : HexColor { return this._mainColor.get(); }

	setColor(type : ColorType, hex : number) : void {
		if (!this._colors.has(type)) {
			this._colors.set(type, HexColor.fromHex(hex));
		} else {
			this._colors.get(type).copyHex(hex);
		}
	}
	hasColor(type : ColorType) : boolean { return this._colors.has(type); }
	color(type : ColorType) : HexColor { return this._colors.get(type); }
}