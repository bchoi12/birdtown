
import { game } from 'game'
import { Component, ComponentType } from 'game/component'
import { Attributes } from 'game/component/attributes'
import { Custom } from 'game/component/custom'
import { Metadata } from 'game/component/metadata'
import { Profile } from 'game/component/profile'
import { Data, DataFilter, DataMap } from 'game/data'

import { defined } from 'util/common'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vec2'

export enum EntityType {
	UNKNOWN,

	PLAYER,
	WALL,
}

export interface EntityOptions {
	id? : number;
	clientId? : number;

	pos? : Vec2;
	dim? : Vec2;
}

export abstract class Entity {

	protected _type : EntityType;
	protected _id : number;

	protected _components : Map<ComponentType, Component>;
	protected _timers : Array<Timer>;

	constructor(type : EntityType, options : EntityOptions) {
		this._type = type;
		this._id = options.id;

		this._components = new Map();
		this.add(new Attributes());
		this.add(new Custom());
		this.add(new Metadata());

		if (defined(options.clientId)) {
			this.metadata().setClientId(options.clientId);
		}

		this._timers = new Array();
	}

	ready() : boolean {
		for (const [_, component] of this._components) {
			if (!component.ready()) {
				return false;
			}
		}
		return true;
	}
	initialized() : boolean { return this.metadata().entityInitialized(); }
	deleted() : boolean { return this.metadata().entityDeleted(); }

	initialize() : void {
		this._components.forEach((component) => {
			component.initialize();
		});
	}
	delete() : void {
		if (this.deleted()) return;

		this._components.forEach((component) => {
			component.delete();
		});
	}

	type() : EntityType { return this._type; }
	id() : number { return this._id; }
	name() : string { return this._type + "," + this._id; }
	clientIdMatches() : boolean { return this.metadata().hasClientId() && this.metadata().clientId() === game.id() }

	add(component : Component) : Component {
		if (this._components.has(component.type())) {
			console.log("Warning: overwriting component " + component.type() + " for object " + this.name());
		}

		component.setEntity(this);
		this._components.set(component.type(), component);
		return component;
	}

	has (type : ComponentType) : boolean { return this._components.has(type); }
	get(type : ComponentType) : Component { return this._components.get(type); }
	attributes() : Attributes { return <Attributes>this._components.get(ComponentType.ATTRIBUTES); }
	custom() : Custom { return <Custom>this._components.get(ComponentType.CUSTOM); }
	metadata() : Metadata { return <Metadata>this._components.get(ComponentType.METADATA); }
	profile() : Profile { return <Profile>this._components.get(ComponentType.PROFILE); }

	newTimer() : Timer {
		let timer = new Timer();
		this._timers.push(timer);
		return timer;
	}

	preUpdate(millis : number) : void {
		this._timers.forEach((timer) => {
			timer.elapse(millis);
		});

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

	preRender() : void {
		this._components.forEach((component) => {
			component.preRender();
		});
	}

	postRender() : void {
		this._components.forEach((component) => {
			component.postRender();
		});
	}

	collide(entity : Entity) : void {}

	filteredData(filter : DataFilter) : DataMap {
		let dataMap : DataMap = {};
		this._components.forEach((component) => {
			if (!component.shouldBroadcast()) {
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
			component.updateData(seqNum);
		});
	}

	mergeData(dataMap : DataMap, seqNum : number) : void {
		for (const [stringType, data] of Object.entries(dataMap)) {
			let component = this.get(Number(stringType));

			if (!component.isSource()) {
				component.mergeData(<DataMap>data, seqNum);
			}
		}
	}
}