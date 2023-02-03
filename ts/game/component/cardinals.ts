
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { CardinalType } from 'game/factory/cardinal_factory'

import { Cardinal } from 'util/cardinal'
import { defined } from 'util/common'

export type CardinalsInitOptions = {
	cardinals? : Map<CardinalType, Cardinal>;
}

export class Cardinals extends ComponentBase implements Component {

	private _cardinals : Map<CardinalType, Cardinal>;

	constructor(init : CardinalsInitOptions) {
		super(ComponentType.CARDINALS);

		if (!defined(init)) { init = {}; }
		this.setName({ base: "cardinals" });

		this._cardinals = new Map();

		if (init.cardinals) {
			init.cardinals.forEach((cardinal : Cardinal, type : CardinalType) => {
				this.setCardinal(type, cardinal);
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
						this.setCardinal(type, new Cardinal());
					}
					this.getCardinal(type).copyBitMask(<number>obj);
				},
			})
		}
	}

	override ready() : boolean { return true; }

	hasCardinal(type : CardinalType) : boolean { return this._cardinals.has(type); }
	getCardinal(type : CardinalType) : Cardinal { return this._cardinals.get(type); }
	setCardinal(type : CardinalType, cardinal : Cardinal) : void { this._cardinals.set(type, cardinal); }
}