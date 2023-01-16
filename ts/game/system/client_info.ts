import * as BABYLON from 'babylonjs'

import { game } from 'game'	
import { EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'

import { Data } from 'network/data'

enum Prop {
	UNKNOWN,
	ID,
	DISPLAY_NAME,
}

export class ClientInfo extends SystemBase implements System {

	private _id : number;
	private _displayName : string;

	constructor(id : number) {
		super(SystemType.CLIENT_INFO);

		this._id = id;
		this._displayName = "";

		this.registerProp(Prop.ID, {
			has: () => { return this._id > 0 },
			export: () => { return this._id; },
			import: (obj : Object) => { this._id = <number>obj; },
			filters: Data.init,
		});
		this.registerProp(Prop.DISPLAY_NAME, {
			has: () => { return this._displayName.length > 0 },
			export: () => { return this._displayName; },
			import: (obj : Object) => { this._displayName = <string>obj; },
			filters: Data.init,
		});
	}

	id() : number { return this._id; }
	setDisplayName(name : string) : void { this._displayName = name; }
	displayName() : string { return this._displayName; }
}