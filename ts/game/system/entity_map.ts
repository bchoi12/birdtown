import * as BABYLON from "babylonjs";
import * as MATTER from 'matter-js'

import { game } from 'game'	
import { GameObject, GameObjectBase } from 'game/core'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Explosion } from 'game/entity/explosion'
import { Player } from 'game/entity/player'
import { Rocket } from 'game/entity/projectile/rocket'
import { Wall } from 'game/entity/wall'
import { Bazooka } from 'game/entity/weapon/bazooka'
import { System, SystemBase, SystemType } from 'game/system'

import { Data, DataFilter, DataMap } from 'network/data'

interface DataItem {
	seqNum : number;
	dataMap : DataMap;
}

export class EntityMap extends SystemBase implements System {
	private readonly _invalidId = 0;

	private _lastId : number;
	private _map : Map<number, Entity>;
	private _initializedEntities : Map<number, Entity>;
	private _pendingData : Array<DataItem>;
	private _factory : Map<EntityType, (options : EntityOptions) => Entity>;

	constructor() {
		super(SystemType.ENTITY_MAP);

		this._lastId = 0;
		this._map = new Map<number, Entity>();
		this._initializedEntities = new Map<number, Entity>();
		this._pendingData = new Array<DataItem>();

		this._factory =  new Map();
		this._factory.set(EntityType.BAZOOKA, (options : EntityOptions) => { return new Bazooka(options); });
		this._factory.set(EntityType.EXPLOSION, (options : EntityOptions) => { return new Explosion(options); });
		this._factory.set(EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); });
		this._factory.set(EntityType.ROCKET, (options : EntityOptions) => { return new Rocket(options); });
		this._factory.set(EntityType.WALL, (options : EntityOptions) => { return new Wall(options); });
	}

	add(type : EntityType, entityOptions? : EntityOptions) : Entity {
		if (!entityOptions) {
			entityOptions = {};
		}

		if (!entityOptions.id) {
			entityOptions.id = this.nextId();
		}

		if (this._map.has(entityOptions.id)) {
			console.error("Warning: overwriting object type " + type + ", id " + entityOptions.id);
		}

		let entity = this._factory.get(type)(entityOptions);
		this._map.set(entityOptions.id, entity);

		console.log("Create entity", entity.name());
		return entity;
	}

	hasId(id : number) : boolean { return this._map.has(id); }
	getId(id : number) : Entity { return this._map.get(id); }
	deleteId(id : number) : void {
		if (!this.hasId(id)) {
			return;
		}

		let entity = this.getId(id);
		entity.dispose();
		this._map.delete(entity.id());
		this._initializedEntities.delete(entity.id());
	}
	pushData(item : DataItem) : void { this._pendingData.push(item); }

	override preUpdate(millis : number) : void {
		while(this._pendingData.length > 0) {
			const item = this._pendingData.pop();
			for (const [stringSpace, entityMap] of Object.entries(item.dataMap)) {
				for (const [stringId, dataMap] of Object.entries(entityMap)) {
					const id = Number(stringId);
					if (!game.options().host && !this.hasId(id)) {
						this.add(Number(stringSpace), {id: id});
					}
					if (this.hasId(id)) {
						this.getId(id).importData(<DataMap>dataMap, item.seqNum);
					}
				}
			}
		}

		this._map.forEach((entity) => {
			if (!entity.initialized() && entity.ready()) {
				entity.initialize();
				this._initializedEntities.set(entity.id(), entity);
			}

			if (entity.deleted()) {
				this.deleteId(entity.id());
			}
		});

		this._initializedEntities.forEach((entity) => {
			entity.preUpdate(millis);
		});
	}

	override update(millis : number) : void {
		this._initializedEntities.forEach((entity) => {
			entity.update(millis);
		});
	}

	override postUpdate(millis : number) : void {
		this._initializedEntities.forEach((entity) => {
			entity.postUpdate(millis);
		});
	}

	override prePhysics(millis : number) : void {
		this._initializedEntities.forEach((entity) => {
			entity.prePhysics(millis);
		});
	}

	override postPhysics(millis : number) : void {
		const collisions = MATTER.Detector.collisions(game.physics().detector);
		collisions.forEach((collision) => {
			if (!collision.pair) return;

			const pair = collision.pair;
			if (!pair.bodyA || !pair.bodyA.label || !pair.bodyB || !pair.bodyB.label) {
				return;
			}

			const idA = Number(pair.bodyA.label);
			const idB = Number(pair.bodyB.label);

			if (Number.isNaN(idA) || Number.isNaN(idB)) {
				return;
			}

			if (!this._initializedEntities.has(idA) || !this._initializedEntities.has(idB)) {
				return;
			}

			this._initializedEntities.get(idA).collide(this._initializedEntities.get(idB), collision);

			collision.normal = {x: -collision.normal.x, y: -collision.normal.y};
			this._initializedEntities.get(idB).collide(this._initializedEntities.get(idA), collision);		
		});

		this._initializedEntities.forEach((entity) => {
			entity.postPhysics(millis);
		});
	}

	override preRender() : void {
		this._initializedEntities.forEach((entity) => {
			entity.preRender();
		});
	}

	override postRender() : void {
		this._initializedEntities.forEach((entity) => {
			entity.postRender();
		});
	}

	override updateData(seqNum : number) : void {
		this._initializedEntities.forEach((entity) => {
			entity.updateData(seqNum);
		});
	}

	override dataMap(filter : DataFilter) : DataMap {
		let dataMap : DataMap = {};
		this._initializedEntities.forEach((entity) => {	
			const data = entity.dataMap(filter);
			if (Object.keys(data).length > 0) {
				if (!dataMap.hasOwnProperty(entity.type())) {
					dataMap[entity.type()] = {};
				}
				dataMap[entity.type()][entity.id()] = data;
			}
		});
		return dataMap;
	}

	private nextId() : number {
		return ++this._lastId;
	}

	private idFromName(name : string) : number {
		const pieces = name.split(",");
		if (pieces.length !== 2) {
			console.error("Invalid name: " + name);
			return this._invalidId;
		}

		const id = Number(pieces[1]);
		if (!Number.isInteger(id)) {
			console.error("ID from name is non-integer: " + name);
			return this._invalidId;
		}

		return id;
	}
}