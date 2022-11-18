
import { Data, DataFilter } from 'game/data'
import { Entity } from 'game/entity'

export enum ComponentType {
	UNKNOWN,
	KEYS,
	PROFILE,
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

	data(filter : DataFilter, seqNum : number) : Map<number, Object>;
	updateData(seqNum : number) : void;
	setData(data : Map<number, Object>, seqNum : number) : void;
};

export class ComponentBase {

	protected _entity : Entity;
	protected _type : ComponentType;
	protected _data : Data;

	constructor(type : ComponentType) {
		this._entity = null;
		this._type = type;
		this._data = new Data();
	}

	setEntity(entity : Entity) : void { this._entity = entity; }
	entity() : Entity { return this._entity; }
	type() : ComponentType { return this._type; }

	preUpdate(millis : number) : void {}
	update(millis : number) : void {}
	postUpdate(millis : number) : void {}
	prePhysics(millis : number) : void {}
	postPhysics(millis : number) : void {}
	postRender(millis : number) : void {}

	data(filter : DataFilter, seqNum : number) : Map<number, Object> { return this._data.filtered(filter, seqNum); };
	updateData(seqNum : number) : void {}
	setData(data : Map<number, Object>, seqNum : number) : void {}
}