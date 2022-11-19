
import { game } from 'game'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity } from 'game/entity'

export enum ComponentType {
	UNKNOWN = 0,
	PROFILE = 1,
	KEYS = 2,
}

export interface Component {
	type() : ComponentType;
	setEntity(entity : Entity) : void;

	preUpdate(millis : number) : void
	update(millis : number) : void
	postUpdate(millis : number) : void
	prePhysics(millis : number) : void
	postPhysics(millis : number) : void
	postRender(millis : number) : void

	dataEnabled() : boolean;
	data(filter : DataFilter, seqNum : number) : DataMap;
	updateData(seqNum : number) : void;
	mergeData(data : DataMap, seqNum : number) : void;
};

export class ComponentBase {

	protected _entity : Entity;
	protected _type : ComponentType;
	protected _data : Data;
	protected _clientSide : boolean;

	constructor(type : ComponentType) {
		this._entity = null;
		this._type = type;
		this._data = new Data();
		this._clientSide = false;
	}

	entity() : Entity { return this._entity; }
	type() : ComponentType { return this._type; }
	setEntity(entity : Entity) : void { this._entity = entity; }
	setClientSide(clientSide : boolean) : void { this._clientSide = clientSide; }

	preUpdate(millis : number) : void {}
	update(millis : number) : void {}
	postUpdate(millis : number) : void {}
	prePhysics(millis : number) : void {}
	postPhysics(millis : number) : void {}
	postRender(millis : number) : void {}

	dataEnabled() : boolean { return game.options().host || this._clientSide; }
	data(filter : DataFilter, seqNum : number) : DataMap { return this._data.filtered(filter, seqNum); }
	updateData(seqNum : number) : void {}
	mergeData(data : DataMap, seqNum : number) : void {}
}