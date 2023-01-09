import { game } from 'game'
import { Data, DataFilter, DataMap, DataNode } from 'game/data'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

export enum ComponentType {
	UNKNOWN,
	ATTRIBUTES,
	CUSTOM,
	INPUT,
	KEYS,
	LAKITU,
	METADATA,
	MODEL,
	PROFILE,
}

interface ComponentCommon {
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
	isSource(prop? : number) : boolean;
	data() : Data;
	dataMap(filter : DataFilter) : DataMap;
	updateData(seqNum : number) : void;
	importData(data : DataMap, seqNum : number) : void;
}

export interface Component extends ComponentCommon {
	type() : ComponentType;
}

export interface SubComponent extends ComponentCommon {

}

abstract class ComponentCommonBase implements ComponentCommon {
	protected _initialized : boolean;
	protected _deleted : boolean;
	protected _data : Data;
	protected _lastMergeTime : number;

	protected _entity : Entity;

	constructor() {
		this._initialized = false;
		this._deleted = false;
		this._data = new Data();
		this._lastMergeTime = Date.now();
	}

	ready() : boolean { return true; };
	initialized() : boolean { return this._initialized; }
	initialize() : void { this._initialized = true; }
	delete() : void { this._deleted = true; }
	deleted() : boolean { return this._deleted; }
	dispose() : void {}

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
	isSource(prop? : number) : boolean { return game.options().host; }
	data() : Data { return this._data; }
	dataMap(filter : DataFilter) : DataMap { return this.isSource() ? this._data.filtered(filter) : {}; }
	updateData(seqNum : number) : void {}
	importData(data : DataMap, seqNum : number) : void { this._lastMergeTime = Date.now(); }
	protected setProp(prop : number, data : DataNode, seqNum : number, cb? : () => boolean) : boolean {
		if (this.isSource(prop)) {
			return this._data.set(prop, data, seqNum, () => {
				return defined(cb) ? cb() : true;
			});
		}

		return false;
	}
}

export abstract class ComponentBase extends ComponentCommonBase implements Component {
	protected _type : ComponentType;

	constructor(type : ComponentType) {
		super();

		this._type = type;
	}

	type() : ComponentType { return this._type; }
}

export abstract class SubComponentBase extends ComponentCommonBase implements SubComponent {

	constructor() {
		super();
	}
}