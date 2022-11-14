
import { Entity } from 'game/entity'

export enum ComponentType {
	UNKNOWN,
	KEYS,
	BODY,
}

export interface Component {
	type() : ComponentType;
	setEntity(entity : Entity) : void;

	preUpdate(ts : number) : void
	update(ts : number) : void
	postUpdate(ts : number) : void
	postPhysics(ts : number) : void
	postRender(ts : number) : void

	// TODO: serialization methods
};

export class ComponentBase {

	protected _entity : Entity;
	protected _type : ComponentType;

	constructor(type : ComponentType) {
		this._type = type;
	}

	setEntity(entity : Entity) : void { this._entity = entity; }
	type() : ComponentType { return this._type; }

	preUpdate(ts : number) : void {}
	update(ts : number) : void {}
	postUpdate(ts : number) : void {}
	postPhysics(ts : number) : void {}
	postRender(ts : number) : void {}
}