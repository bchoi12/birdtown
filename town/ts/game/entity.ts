
import { Component, ComponentType } from 'game/component'
import { Keys } from 'game/keys'

export class Entity {

	protected _space : number;
	protected _id : number;

	protected _components : Map<ComponentType, Component>;

	constructor(space : number, id : number) {
		this._space = space;
		this._id = id;

		this._components = new Map();
	}

	addComponent(type : ComponentType) : void {
		switch(type) {
		case ComponentType.KEYS:
			this._components.set(type, new Keys());
			break;
		default:
			console.error("Unknown component type: " + type);
			break;
		}
	}

	update(ts : number) : void {
		this._components.forEach((component) => {
			component.update(ts);
		})
	}
}