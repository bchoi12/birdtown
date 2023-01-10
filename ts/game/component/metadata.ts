import { Component, ComponentBase, ComponentType } from 'game/component'

import { Data, DataFilter, DataMap } from 'network/data'

import { defined } from 'util/common'

export type MetadataInitOptions = {
	clientId? : number;	
}

enum Prop {
	UNKNOWN,

	CLIENT_ID,
	DELETED,
}

export class Metadata extends ComponentBase implements Component {

	private _entityInitialized : boolean;
	private _entityDeleted : boolean;
	private _clientId : number;

	constructor(initOptions? : MetadataInitOptions) {
		super(ComponentType.METADATA);

		this._entityInitialized = false;
		this._entityDeleted = false;

		if (initOptions) {
			if (initOptions.clientId) { this.setClientId(initOptions.clientId); }
		}
	}

	entityInitialized() : boolean { return this._entityInitialized; }
	entityDeleted() : boolean { return this._entityDeleted; }
	clientId() : number { return this._clientId; }

	hasClientId() : boolean { return defined(this._clientId); }

	setEntityInitialized(initialized : boolean) : void { this._entityInitialized = initialized; }
	setEntityDeleted(deleted : boolean) : void { this._entityDeleted = deleted; }
	setClientId(id : number) : void { this._clientId = id; }

	override ready() { return true; }

	override initialize() {
		super.initialize();

		this._entityInitialized = true;
	}

	override delete() : void {
		super.delete();

		this._entityDeleted = true;
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		if (this.hasClientId()) {
			this.setProp(Prop.CLIENT_ID, this._clientId, seqNum);
		}

		if (this._entityDeleted) {
			this.setProp(Prop.DELETED, true, seqNum);
		}
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		const changed = this._data.import(data, seqNum);

		if (changed.size === 0) {
			return;
		}

		if (changed.has(Prop.CLIENT_ID)) {
			this._clientId = <number>this._data.get(Prop.CLIENT_ID);
		}

		if (changed.has(Prop.DELETED)) {
			if (<boolean>this._data.get(Prop.DELETED)) {
				this.entity().delete();
			}
		}
	}
}