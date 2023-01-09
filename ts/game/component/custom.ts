import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataMap } from 'game/data'

import { defined } from 'util/common'

export class Custom extends ComponentBase implements Component {

	private _props : Map<number, any>;

	constructor() {
		super(ComponentType.CUSTOM);

		this._props = new Map();
	}

	set(prop : number, data : any) : void {
		if (defined(data)) {
			this._props.set(prop, data);
		}
	}
	has(prop : number) : boolean { return this._props.has(prop); }
	get(prop : number) : any { return this._props.get(prop); }

	override ready() : boolean { return true; }

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this._props.forEach((data : any, prop : number) => {
			this.setProp(prop, data, seqNum);
		});
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		const changed = this._data.import(data, seqNum);

		if (changed.size === 0) {
			return;
		}

		this._props.forEach((data : any, prop : number) => {
			if (changed.has(prop)) {
				this._props.set(prop, data);
			}
		});
	}
}