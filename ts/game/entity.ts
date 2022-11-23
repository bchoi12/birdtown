import { Vec2 } from 'game/common'
import { Component, ComponentType } from 'game/component'
import { Life } from 'game/component/life'
import { Profile } from 'game/component/profile'
import { Data, DataFilter, DataMap } from 'game/data'

export enum EntityType {
	UNKNOWN = 0,
	WALL = 1,
	PLAYER = 2,
}

export interface EntityOptions {
	id? : number;
	clientId? : number;

	pos? : Vec2;
}

export abstract class Entity {

	protected _type : EntityType;
	protected _id : number;
	protected _initialized : boolean;
	protected _deleted : boolean;

	protected _components : Map<ComponentType, Component>;

	constructor(type : EntityType, options : EntityOptions) {
		this._type = type;
		this._id = options.id;
		this._initialized = false;
		this._deleted = false;

		this._components = new Map();
		this.add(new Life());
	}

	ready() : boolean {
		for (const [_, component] of this._components) {
			if (!component.ready()) {
				return false;
			}
		}
		return true;
	}
	initialized() : boolean { return this._initialized; }
	deleted() : boolean { return this._deleted; }

	initialize() : void {
		this._components.forEach((component) => {
			component.initialize();
		});
		this._initialized = true;
	}
	delete() : void {
		if (this._deleted) return;

		this._components.forEach((component) => {
			component.delete();
		});

		this._deleted = true;
	}

	type() : EntityType { return this._type; }
	id() : number { return this._id; }
	name() : string { return this._type + "," + this._id; }

	add(component : Component) : Component {
		component.setEntity(this);
		this._components.set(component.type(), component);
		return component;
	}

	get(type : ComponentType) : Component { return this._components.get(type); }
	profile() : Profile { return <Profile>this._components.get(ComponentType.PROFILE); }

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

	filteredData(filter : DataFilter) : DataMap {
		let dataMap : DataMap = {};
		this._components.forEach((component) => {
			if (!component.authoritative()) {
				return;
			}
			const data = component.filteredData(filter);
			if (Object.keys(data).length > 0) {
				dataMap[component.type()] = data;
			}
		});
		return dataMap;
	}

	updateData(seqNum : number) : void {
		this._components.forEach((component) => {
			if (component.authoritative()) {
				component.updateData(seqNum);
			}
		});
	}

	mergeData(dataMap : DataMap, seqNum : number) : void {
		for (const [stringType, data] of Object.entries(dataMap)) {
			let component = this.get(Number(stringType));
			component.mergeData(<DataMap>data, seqNum);
		}
	}
}