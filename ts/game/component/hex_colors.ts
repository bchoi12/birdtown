
import { ColorType } from 'game/color_factory'
import { Component, ComponentBase, ComponentType } from 'game/component'

import { defined } from 'util/common'
import { HexColor } from 'util/hex_color'

export type HexColorsInitOptions = {
	colors? : Map<number, HexColor>;
}

export class HexColors extends ComponentBase implements Component {

	private _colors : Map<number, HexColor>;

	constructor(init : HexColorsInitOptions) {
		super(ComponentType.HEX_COLORS);

		if (!defined(init)) { init = {}; }
		this.setName({ base: "colors" });

		this._colors = new Map();
		if (init.colors) {
			init.colors.forEach((color : HexColor, id : number) => {
				this.setColor(id, color);
			});
		}

		for (const stringColor in ColorType) {
			const color = Number(ColorType[stringColor]);
			if (Number.isNaN(color) || color <= 0) {
				continue;
			}

			this.registerProp(color, {
				has: () => { return this._colors.has(color); },
				export: () => { return this._colors.get(color).toObject(); },
				import: (obj : Object) => {
					if (!this._colors.has(color)) {
						this._colors.set(color, HexColor.fromObject(obj));
					}
					this._colors.get(color).copyObject(obj);
				},
			})
		}
	}

	override ready() : boolean { return true; }

	setColor(id : number, color : HexColor) : void { this._colors.set(id, color); }
	hasColor(id : number) : boolean { return this._colors.has(id); }
	getColor(id : number) : HexColor { return this._colors.get(id); }
}