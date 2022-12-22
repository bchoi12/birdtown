import { game } from 'game'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

export enum ComponentType {
	UNKNOWN,
	METADATA,
	CUSTOM,

	ATTRIBUTES,
	KEYS,
	MESH,
	PROFILE,
}

export interface Component {
	type() : ComponentType;
	hasEntity() : boolean;
	entity() : Entity;
	setEntity(entity : Entity) : void;

	ready() : boolean;
	initialized() : boolean;
	initialize() : void;
	delete() : void;
	dispose() : void;

	preUpdate(millis : number) : void
	update(millis : number) : void
	postUpdate(millis : number) : void
	prePhysics(millis : number) : void
	postPhysics(millis : number) : void
	preRender() : void
	postRender() : void

	shouldBroadcast() : boolean;
	isSource() : boolean;
	filteredData(filter : DataFilter) : DataMap;
	updateData(seqNum : number) : void;
	mergeData(data : DataMap, seqNum : number) : void;
};

export abstract class ComponentBase {

	protected _initialized : boolean;
	protected _entity : Entity;
	protected _type : ComponentType;
	protected _data : Data;
	protected _lastMergeTime : number;

	constructor(type : ComponentType) {
		this._initialized = false;
		this._entity = null;
		this._type = type;
		this._data = new Data();
		this._lastMergeTime = Date.now();
	}

	abstract ready() : boolean;
	initialized() : boolean { return this._initialized; }
	initialize() : void {
		this._initialized = true;
	}
	delete() : void {}
	dispose() : void {}

	type() : ComponentType { return this._type; }
	hasEntity() : boolean { return defined(this._entity); }
	entity() : Entity { return this._entity; }
	setEntity(entity : Entity) : void { this._entity = entity; }

	preUpdate(millis : number) : void {}
	update(millis : number) : void {}
	postUpdate(millis : number) : void {}
	prePhysics(millis : number) : void {}
	postPhysics(millis : number) : void {}
	preRender() : void {}
	postRender() : void {}

	shouldBroadcast() : boolean { return game.options().host; }
	isSource() : boolean { return game.options().host; }
	filteredData(filter : DataFilter) : DataMap { return this._data.filtered(filter); }
	updateData(seqNum : number) : void {}
	mergeData(data : DataMap, seqNum : number) : void {
		this._lastMergeTime = Date.now();
	}
	protected setProp(prop : number, data : Object, seqNum : number, cb? : () => boolean) : boolean {
		if (this.isSource()) {
			return this._data.update(prop, data, seqNum, () => {
				return defined(cb) ? cb() : true;
			});
		}

		return this._data.set(prop, data);
	}
}