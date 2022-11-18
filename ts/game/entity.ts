import { Vec2 } from 'game/common'
import { Component, ComponentType } from 'game/component'
import { Data, DataFilter } from 'game/data'


export enum EntityType {
	UNKNOWN = 0,
	WALL = 1,
	PLAYER = 2,
}

export interface EntityOptions {
	pos : Vec2;

	id? : number;
}

export class Entity {

	protected _type : EntityType;
	protected _id : number;

	protected _data : Data;
	protected _components : Map<ComponentType, Component>;

	constructor(type : EntityType, options : EntityOptions) {
		this._type = type;
		this._id = options.id;

		this._data = new Data();
		this._components = new Map();
	}

	type() : EntityType { return this._type; }
	id() : number { return this._id; }
	name() : string { return this._type + "," + this._id; }

	add(component : Component) : void {
		component.setEntity(this);
		this._components.set(component.type(), component);
	}

	get(type : ComponentType) : Component {
		return this._components.get(type);
	}

	preUpdate(millis : number) : void {
		this._components.forEach((component) => {
			component.preUpdate(millis);
		});
	}

	update(millis : number) : void {
		this._components.forEach((component) => {
			component.update(millis);
		});
	}

	postUpdate(millis : number) : void {
		this._components.forEach((component) => {
			component.postUpdate(millis);
		});
	}

	prePhysics(millis : number) : void {
		this._components.forEach((component) => {
			component.prePhysics(millis);
		});
	}

	postPhysics(millis : number) : void {
		this._components.forEach((component) => {
			component.postPhysics(millis);
		});
	}

	postRender(millis : number) : void {
		this._components.forEach((component) => {
			component.postRender(millis);
		});
	}

	collide(entity : Entity) : void {}

	data(filter : DataFilter, seqNum : number) : Data {
		this._components.forEach((component) => {
			const data = component.data(filter, seqNum);
			this._data.set(component.type(), data, seqNum, () => { return !data.empty(); })
		});
		return this._data;
	}

	updateData(seqNum : number) : void {
		this._components.forEach((component) => {
			component.updateData(seqNum);
		});
	}
}