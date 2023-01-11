import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentType } from 'game/component'
import { GameObject, GameObjectBase } from 'game/core'
import { Attribute, Attributes, AttributesInitOptions } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Metadata, MetadataInitOptions } from 'game/component/metadata'
import { Profile, ProfileInitOptions } from 'game/component/profile'
import { Data, DataFilter, DataMap } from 'network/data'

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

export type EntityOptions = {
	id? : number;

	attributesInit? : AttributesInitOptions;
	metadataInit? : MetadataInitOptions;
	profileInit? : ProfileInitOptions
}

export interface Entity extends GameObject {
	type() : EntityType;
	id() : number;

	addComponent(component : Component) : Component;
	hasComponent(type : ComponentType) : boolean;
	getComponent(type : ComponentType) : Component;

	// TODO: deprecate
	add(component : Component) : Component;
	has(type : ComponentType) : boolean;
	get(type : ComponentType) : Component;

	// TODO: deprecate
	attributes() : Attributes;
	model() : Model;
	metadata() : Metadata;
	profile() : Profile;

	collide(other : Entity, collision : MATTER.Collision) : void;
	newTimer() : Timer;
	setTTL(ttl : number);
}

export abstract class EntityBase extends GameObjectBase implements Entity {
	protected _type : EntityType;
	protected _id : number;

	protected _components : Map<ComponentType, Component>;
	protected _timers : Array<Timer>;

	private _notReadyCounter : number;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super("entity-" + type + "," + entityOptions.id);

		this._type = type;

		if (!defined(entityOptions.id)) {
			console.error("Warning: entity type " + type + " has no id");
		}
		this._id = entityOptions.id;

		this._components = new Map();
		this.add(new Attributes(entityOptions.attributesInit));
		this.add(new Metadata(entityOptions.metadataInit));

		this._timers = new Array();

		this._notReadyCounter = 0;
	}

	override ready() : boolean {
		if (this._notReadyCounter > 0 && this._notReadyCounter % 60 === 0) {
			console.error("Warning: %s still not ready", this.name());
		}

		for (const [_, component] of this._components) {
			if (!component.ready()) {
				this._notReadyCounter++;
				return false;
			}
		}
		return true;
	}
	override initialized() : boolean { return this.metadata().entityInitialized(); }
	override deleted() : boolean { return this.metadata().entityDeleted(); }

	override initialize() : void {
		this._components.forEach((component) => {
			component.initialize();
		});
	}
	override delete() : void {
		if (this.deleted()) return;

		this._components.forEach((component) => {
			component.delete();
		});
	}

	override dispose() : void {
		this._components.forEach((component) => {
			component.dispose();
		});
	}

	type() : EntityType { return this._type; }
	id() : number { return this._id; }
	clientIdMatches() : boolean { return this.metadata().hasClientId() && this.metadata().clientId() === game.id() }

	addComponent(component : Component) : Component {
		if (this._components.has(component.type())) {
			console.log("Warning: overwriting component " + component.type() + " for object " + this.name());
		}

		component.setEntity(this);
		this._components.set(component.type(), component);
		return component;
	}
	hasComponent(type : ComponentType) : boolean { return this._components.has(type); }
	getComponent(type : ComponentType) : Component { return this._components.get(type); }

	// TODO: deprecate
	add(component : Component) : Component { return this.addComponent(component); }
	has(type : ComponentType) : boolean { return this.hasComponent(type); }
	get(type : ComponentType) : Component { return this.getComponent(type); }
	attributes() : Attributes { return <Attributes>this._components.get(ComponentType.ATTRIBUTES); }
	model() : Model { return <Model>this._components.get(ComponentType.MODEL); }
	metadata() : Metadata { return <Metadata>this._components.get(ComponentType.METADATA); }
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

	collide(entity : Entity, collision : MATTER.Collision) : void {}

	override preUpdate(millis : number) : void {
		this._timers.forEach((timer) => {
			timer.elapse(millis);
		});

		this._components.forEach((component) => {
			component.preUpdate(millis);
		});
	}

	override update(millis : number) : void {
		this._components.forEach((component) => {
			component.update(millis);
		});
	}

	override postUpdate(millis : number) : void {
		this._components.forEach((component) => {
			component.postUpdate(millis);
		});
	}

	override prePhysics(millis : number) : void {
		this._components.forEach((component) => {
			component.prePhysics(millis);
		});
	}

	override postPhysics(millis : number) : void {
		this._components.forEach((component) => {
			component.postPhysics(millis);
		});
	}

	override preRender() : void {
		this._components.forEach((component) => {
			component.preRender();
		});
	}

	override postRender() : void {
		this._components.forEach((component) => {
			component.postRender();
		});
	}

	override shouldBroadcast() : boolean { return game.options().host; }
	override isSource() : boolean { return game.options().host; }

	override dataMap(filter : DataFilter) : DataMap {
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

	override updateData(seqNum : number) : void {
		this._components.forEach((component) => {
			if (component.isSource()) {
				component.updateData(seqNum);
			}
		});
	}

	override importData(dataMap : DataMap, seqNum : number) : void {
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