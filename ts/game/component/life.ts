
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

enum Prop {
	UNKNOWN = 0,
	DELETED = 1,
}

export class Life extends ComponentBase implements Component {

	constructor() {
		super(ComponentType.LIFE);
	}

	override ready() { return true; }

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		if (this.entity().deleted()) {
			this.setProp(Prop.DELETED, true, seqNum);
		}
	}

	override mergeData(data : DataMap, seqNum : number) : void {
		super.mergeData(data, seqNum);

		const changed = this._data.merge(data, seqNum);

		if (changed.size === 0) {
			return;
		}

		if (changed.has(Prop.DELETED)) {
			if (<boolean>this._data.get(Prop.DELETED)) {
				this.entity().delete();
			}
		}
	}
}