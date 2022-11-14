import { Component, ComponentType } from 'game/component'
import { Data } from 'game/data'
import { SpacedId } from 'game/spaced_id'

export interface Vec2 {
	x : number;
	y : number;
}

export interface EntityOptions {
	spacedId : SpacedId;
	pos : Vec2;
}

export class Entity {

	protected _spacedId : SpacedId;
	protected _data : Data;

	protected _components : Map<ComponentType, Component>;

	constructor(options : EntityOptions) {
		this._spacedId = options.spacedId;
		this._components = new Map();
	}

	spacedId() : SpacedId { return this._spacedId; }

	add(component : Component) : void {
		component.setEntity(this);
		this._components.set(component.type(), component);
	}

	get(type : ComponentType) : Component {
		return this._components.get(type);
	}

	preUpdate(ts : number) : void {
		this._components.forEach((component) => {
			component.preUpdate(ts);
		});
	}

	update(ts : number) : void {
		this._components.forEach((component) => {
			component.update(ts);
		});
	}

	postUpdate(ts : number) : void {
		this._components.forEach((component) => {
			component.postUpdate(ts);
		});
	}

	postPhysics(ts : number) : void {
		this._components.forEach((component) => {
			component.postPhysics(ts);
		});
	}

	postRender(ts : number) : void {
		this._components.forEach((component) => {
			component.postRender(ts);
		});
	}
}