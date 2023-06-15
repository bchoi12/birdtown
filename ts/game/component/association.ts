
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { AssociationType, ComponentType } from 'game/component/api'

import { defined } from 'util/common'

export type AssociationInitOptions = {
	associations? : Map<AssociationType, number>;
}

export class Association extends ComponentBase implements Component {

	private _associations : Map<AssociationType, number>;

	constructor(init : AssociationInitOptions) {
		super(ComponentType.ASSOCIATION);

		if (!defined(init)) { init = {}; }
		this.setName({ base: "associations" });

		this._associations = new Map();

		if (init.associations) {
			init.associations.forEach((value, key) => {
				this.setAssociation(key, value);
			});
		}

		for (const stringAssociation in AssociationType) {
			const type = Number(AssociationType[stringAssociation]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			this.registerProp<number>(type, {
				has: () => { return this.hasAssociation(type); },
				export: () => { return this.getAssociation(type); },
				import: (obj : number) => { this.setAssociation(type, obj); },
			})
		}
	}

	hasAssociation(type : AssociationType) : boolean { return this._associations.has(type); }
	getAssociation(type : AssociationType) : number {
		if (!this.hasAssociation(type)) {
			console.error("Warning: retrieving unset association %d, defaulting to 0", type);
			return 0;
		}
		return this._associations.get(type);
	}
	setAssociation(type : AssociationType, value : number) : void { this._associations.set(type, value); }
}