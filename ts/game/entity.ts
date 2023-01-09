import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentType } from 'game/component'
import { Attribute, Attributes, AttributesInitOptions } from 'game/component/attributes'
import { Custom } from 'game/component/custom'
import { Model } from 'game/component/model'
import { Metadata, MetadataInitOptions } from 'game/component/metadata'
import { Profile, ProfileInitOptions } from 'game/component/profile'
import { Data, DataFilter, DataMap } from 'game/data'

import { defined } from 'util/common'
import { Timer } from 'util/timer'
import { Vec } from 'util/vector'

export enum EntityType {
	UNKNOWN,

	BAZOOKA,
	EXPLOSION,
	PLAYER,
	ROCKET,
	WALL,
}

export interface EntityOptions {
	id? : number;

	attributesInit? : AttributesInitOptions;
	metadataInit? : MetadataInitOptions;
	profileInit? : ProfileInitOptions
}

export abstract class Entity {

	protected _type : EntityType;
	protected _id : number;

	protected _components : Map<ComponentType, Component>;
	protected _timers : Array<Timer>;

	constructor(type : EntityType, options : EntityOptions) {
		this._type = type;

		if (!defined(options.id)) {
			console.error("Warning: entity type " + type + " has no id");
		}
		this._id = options.id;

		this._components = new Map();
		this.add(new Attributes(options.attributesInit));
		this.add(new Custom());
		this.add(new Metadata(options.metadataInit));

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

	dispose() : void {
		this._components.forEach((component) => {
			component.dispose();
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

	has(type : ComponentType) : boolean { return this._components.has(type); }
	get(type : ComponentType) : Component { return this._components.get(type); }
	attributes() : Attributes { return <Attributes>this._components.get(ComponentType.ATTRIBUTES); }
	custom() : Custom { return <Custom>this._components.get(ComponentType.CUSTOM); }
	hasModel() : boolean { return this.has(ComponentType.MODEL); }
	model() : Model { return <Model>this._components.get(ComponentType.MODEL); }
	metadata() : Metadata { return <Metadata>this._components.get(ComponentType.METADATA); }
	hasProfile() : boolean { return this.has(ComponentType.PROFILE); }
	profile() : Profile { return <Profile>this._components.get(ComponentType.PROFILE); }

	newTimer() : Timer {
		let timer = new Timer();
		this._timers.push(timer);
		return timer;
	}
	setTTL(ttl : number) : void {
		const timer = this.newTimer();
		timer.start(ttl, () => {
			this.delete();
		});
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

	collide(entity : Entity, collision : MATTER.Collision) : void {}

	dataMap(filter : DataFilter) : DataMap {
		let dataMap : DataMap = {};
		this._components.forEach((component) => {
			if (!component.shouldBroadcast()) {
				return;
			}
			const data = component.dataMap(filter);
			if (Object.keys(data).length > 0) {
				dataMap[component.type()] = data;
			}
		});
		return dataMap;
	}

	updateData(seqNum : number) : void {
		this._components.forEach((component) => {
			if (component.isSource()) {
				component.updateData(seqNum);
			}
		});
	}

	importData(dataMap : DataMap, seqNum : number) : void {
		for (const [stringType, data] of Object.entries(dataMap)) {
			if (!this.has(Number(stringType))) {
				console.log("Error: object " + this.name() + " is missing component " + stringType);
				continue;
			}

			let component = this.get(Number(stringType));

			if (!component.isSource()) {
				component.importData(<DataMap>data, seqNum);
			}
		}
	}
}