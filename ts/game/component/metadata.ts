
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

enum Prop {
	UNKNOWN,

	CLIENT_ID,
	DELETED,
}

export class Metadata extends ComponentBase implements Component {

	constructor() {
		super(ComponentType.METADATA);
	}

	override ready() { return true; }

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		if (this.entity().hasClientId()) {
			this.setProp(Prop.CLIENT_ID, this.entity().clientId(), seqNum);
		}

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

		if (changed.has(Prop.CLIENT_ID)) {
			this.entity().setClientId(<number>this._data.get(Prop.CLIENT_ID));
		}

		if (changed.has(Prop.DELETED)) {
			if (<boolean>this._data.get(Prop.DELETED)) {
				this.entity().delete();
			}
		}
	}
}