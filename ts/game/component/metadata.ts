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

// TODO: deprecate
export class Metadata extends ComponentBase implements Component {

	private _entityInitialized : boolean;
	private _entityDeleted : boolean;
	private _clientId : number;

	constructor(initOptions? : MetadataInitOptions) {
		super(ComponentType.METADATA);

		this.setName({ base: "metadata" });

		this._entityInitialized = false;
		this._entityDeleted = false;

		if (initOptions) {
			if (initOptions.clientId) { this.setClientId(initOptions.clientId); }
		}

		this.registerProp(Prop.CLIENT_ID, {
			has: () => { return this.hasClientId(); },
			export: () => { return this.clientId(); },
			import: (obj : Object) => { this.setClientId(<number>obj); },
		});
		this.registerProp(Prop.DELETED, {
			export: () => { return this._entityDeleted; },
			import: (obj : Object) => {
				if (<boolean>obj) {
					this.entity().delete();
				}
			},
		});
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
}