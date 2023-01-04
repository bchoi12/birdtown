import { game } from 'game'
import { Data, DataFilter, DataMap, DataNode } from 'game/data'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

export enum ComponentType {
	UNKNOWN,
	METADATA,
	CUSTOM,

	ATTRIBUTES,
	BODY,
	KEYS,
	MODEL,
	PROFILE,
}

export interface Component {
	type() : ComponentType
	ready() : boolean;
	initialized() : boolean;
	initialize() : void;
	delete() : void;
	dispose() : void;

	hasEntity() : boolean;
	entity() : Entity;
	setEntity(entity : Entity) : void;

	preUpdate(millis : number) : void
	update(millis : number) : void
	postUpdate(millis : number) : void
	prePhysics(millis : number) : void
	postPhysics(millis : number) : void
	preRender() : void
	postRender() : void

	shouldBroadcast() : boolean;
	isSource() : boolean;
	data() : Data;
	dataMap(filter : DataFilter) : DataMap;
	updateData(seqNum : number) : void;
	mergeData(data : DataMap, seqNum : number) : void;
}

export interface SuperComponent extends Component {
	add(key : number, component : Component) : void;
	has(key : number) : boolean;
	get(key : number) : Component;
}

export abstract class ComponentBase {
	protected _type : ComponentType;
	protected _initialized : boolean;
	protected _deleted : boolean;
	protected _entity : Entity;
	protected _data : Data;
	protected _lastMergeTime : number;

	constructor(type : ComponentType) {
		this._type = type;
		this._initialized = false;
		this._entity = null;
		this._data = new Data();
		this._lastMergeTime = Date.now();
	}

	type() : ComponentType { return this._type; }
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
	isSource() : boolean { return game.options().host; }
	data() : Data { return this._data; }
	dataMap(filter : DataFilter) : DataMap { return this._data.filtered(filter); }
	updateData(seqNum : number) : void {}
	mergeData(data : DataMap, seqNum : number) : void { this._lastMergeTime = Date.now(); }
	protected setProp(prop : number, data : DataNode, seqNum : number, cb? : () => boolean) : boolean {
		if (this.isSource()) {
			return this._data.update(prop, data, seqNum, () => {
				return defined(cb) ? cb() : true;
			});
		}

		return this._data.set(prop, data);
	}
}

export abstract class SuperComponentBase extends ComponentBase {
	protected _subComponents : Map<number, Component>;

	constructor(type : ComponentType) {
		super(type);

		this._subComponents = new Map();
	}

	add(key : number, component : Component) : void {
		component.setEntity(this.entity());
		this._subComponents.set(key, component);
	}
	has(key : number) : boolean { return this._subComponents.has(key); }
	get(key : number) : Component { return this._subComponents.get(key); }

	override updateData(seqNum : number) : void {
		this._subComponents.forEach((component : Component, key : number) => {
			component.updateData(seqNum);
			this.setProp(key, component.data(), seqNum);
		});
	}
	override mergeData(data : DataMap, seqNum : number) : void {
		this._lastMergeTime = Date.now();
		this._subComponents.forEach((component : Component, key : number) => {
			component.mergeData(<DataMap>data[key], seqNum);
		});
	}
}