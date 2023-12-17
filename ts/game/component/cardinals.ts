
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'

import { Cardinal, CardinalType } from 'util/cardinal'
import { defined } from 'util/common'

export type CardinalsInitOptions = {
	cardinals? : Array<Cardinal>;
}

export class Cardinals extends ComponentBase implements Component {

	private _cardinals : Map<CardinalType, Cardinal>;

	constructor(init? : CardinalsInitOptions) {
		super(ComponentType.CARDINALS);

		if (!defined(init)) { init = {}; }

		this._cardinals = new Map();

		if (init.cardinals) {
			init.cardinals.forEach((cardinal : Cardinal) => {
				this.setCardinal(cardinal.type(), cardinal);
			});
		}

		for (const stringType in CardinalType) {
			const type = Number(CardinalType[stringType]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			this.registerProp(type, {
				has: () => { return this.hasCardinal(type); },
				export: () => { return this.getCardinal(type).toBitMask(); },
				import: (obj : Object) => {
					if (!this.hasCardinal(type)) {
						this.setCardinal(type, new Cardinal(type));
					}
					this.getCardinal(type).copyBitMask(<number>obj);
				},
			})
		}
	}

	hasCardinal(type : CardinalType) : boolean { return this._cardinals.has(type); }
	getCardinal(type : CardinalType) : Cardinal { return this._cardinals.get(type); }
	setCardinal(type : CardinalType, cardinal : Cardinal) : void {
		if (this._cardinals.has(type)) {
			console.error("Warning: overwriting cardinal", CardinalType[type]);
		}
		this._cardinals.set(type, cardinal);
	}
}