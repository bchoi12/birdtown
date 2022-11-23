
import { game } from 'game'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity } from 'game/entity'

export enum ComponentType {
	UNKNOWN = 0,
	LIFE = 1,
	PROFILE = 2,
	KEYS = 3,
}

export interface Component {
	type() : ComponentType;
	setEntity(entity : Entity) : void;

	ready() : boolean;
	initialized() : boolean;
	initialize() : void;
	delete() : void;

	preUpdate(millis : number) : void
	update(millis : number) : void
	postUpdate(millis : number) : void
	prePhysics(millis : number) : void
	postPhysics(millis : number) : void
	postRender(millis : number) : void

	dataEnabled() : boolean;
	filteredData(filter : DataFilter) : DataMap;
	updateData(seqNum : number) : void;
	mergeData(data : DataMap, seqNum : number) : void;
};

export abstract class ComponentBase {

	protected _initialized : boolean;
	protected _entity : Entity;
	protected _type : ComponentType;
	protected _data : Data;
	protected _clientSide : boolean;

	constructor(type : ComponentType) {
		this._initialized = false;
		this._entity = null;
		this._type = type;
		this._data = new Data();
		this._clientSide = false;
	}

	abstract ready() : boolean;
	initialized() : boolean { return this._initialized; }
	initialize() : void {
		this._initialized = true;
	}
	delete() : void {}

	entity() : Entity { return this._entity; }
	type() : ComponentType { return this._type; }
	data() : Data { return this._data; }
	clientSide() : boolean { return this._clientSide; }
	setEntity(entity : Entity) : void { this._entity = entity; }
	setClientSide(clientSide : boolean) : void { this._clientSide = clientSide; }

	preUpdate(millis : number) : void {}
	update(millis : number) : void {}
	postUpdate(millis : number) : void {}
	prePhysics(millis : number) : void {}
	postPhysics(millis : number) : void {}
	postRender(millis : number) : void {}

	dataEnabled() : boolean { return game.options().host || this._clientSide; }
	filteredData(filter : DataFilter) : DataMap {
		if (!game.options().host && !this._clientSide) {
			return {};
		}
		return this._data.filtered(filter);
	}
	updateData(seqNum : number) : void {}
	mergeData(data : DataMap, seqNum : number) : void {}
	protected setProp(prop : number, data : Object, seqNum : number) : boolean {
		if (game.options().host || this._clientSide) {
			return this._data.update(prop, data, seqNum, () => {
				return !Data.equals(data, this._data.get(prop));
			});
		}

		return this._data.set(prop, data);
	}
}