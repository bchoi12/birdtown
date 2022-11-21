import * as MATTER from 'matter-js'

import { Data, DataFilter, DataMap } from 'game/data'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { Player } from 'game/entity/player'
import { Wall } from 'game/entity/wall'

interface DataItem {
	seqNum : number;
	dataMap : DataMap;
}

export class EntityMap {
	private readonly _invalidId = 0;

	private _lastId : number;
	private _map : Map<number, Entity>;
	private _initialized : Map<number, Entity>;
	private _pendingData : Array<DataItem>;
	private _factory : Map<EntityType, (options : EntityOptions) => Entity>;

	constructor() {
		this._lastId = 0;
		this._map = new Map<number, Entity>();
		this._initialized = new Map<number, Entity>();
		this._pendingData = new Array<DataItem>();

		this._factory =  new Map();
		this._factory.set(EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); });
		this._factory.set(EntityType.WALL, (options : EntityOptions) => { return new Wall(options); });
	}

	add(type : EntityType, options : EntityOptions) : Entity {
		if (!options.id) {
			options.id = this.nextId();
		} else if (options.id > this._lastId) {
			this._lastId = options.id;
		}

		if (this._map.has(options.id)) {
			console.error("Warning: overwriting object type " + type + ", id " + options.id);
		}

		const entity = this._factory.get(type)(options);
		this._map.set(options.id, entity);
		return entity;
	}

	has(id : number) : boolean { return this._map.has(id); }
	get(id : number) : Entity { return this._map.get(id); }
	delete(id : number) : void {
		this._map.delete(id);
		this._initialized.delete(id);
	}
	pushData(item : DataItem) : void { this._pendingData.push(item); }

	update(millis : number) : void {
		while(this._pendingData.length > 0) {
			const item = this._pendingData.pop();
			for (const [stringSpace, entityMap] of Object.entries(item.dataMap)) {
				for (const [stringId, dataMap] of Object.entries(entityMap)) {
					const id = Number(stringId);
					if (!this.has(id)) {
						this.add(Number(stringSpace), {id: id});
					}

					this.get(id).mergeData(<DataMap>dataMap, item.seqNum);
				}
			}
		}

		this._map.forEach((entity) => {
			if (!entity.initialized() && entity.ready()) {
				entity.initialize();
				this._initialized.set(entity.id(), entity);
			}

			if (entity.deleted()) {
				this.delete(entity.id());
			}
		});

		this._initialized.forEach((entity) => {
			entity.preUpdate(millis);
		});

		this._initialized.forEach((entity) => {
			entity.update(millis);
		});

		this._initialized.forEach((entity) => {
			entity.postUpdate(millis);
		});
	}

	prePhysics(millis : number) : void {
		this._initialized.forEach((entity) => {
			entity.prePhysics(millis);
		});
	}

	handleCollisions(collisions : Array<MATTER.Collision>) : void {
		collisions.forEach((collision) => {
			if (!collision.pair) return;

			let pair = collision.pair;
			if (!pair.bodyA || !pair.bodyA.label || !pair.bodyB || !pair.bodyB.label) {
				return;
			}

			const idA = Number(pair.bodyA.label);
			const idB = Number(pair.bodyB.label);

			if (Number.isNaN(idA) || Number.isNaN(idB)) {
				return;
			}

			if (!this._initialized.has(idA) || !this._initialized.has(idB)) {
				return;
			}

			this._initialized.get(idA).collide(this._initialized.get(idB));
			this._initialized.get(idB).collide(this._initialized.get(idA));		
		});
	}

	postPhysics(millis : number) : void {
		this._initialized.forEach((entity) => {
			entity.postPhysics(millis);
		});
	}

	finalize(millis : number) : void {
		this._initialized.forEach((entity) => {
			entity.finalize(millis);
		});
	}

	updateData(seqNum : number) : void {
		this._initialized.forEach((entity) => {
			entity.updateData(seqNum);
		});
	}

	filteredData(filter : DataFilter) : DataMap {
		let dataMap : DataMap = {};
		this._initialized.forEach((entity) => {	
			const data = entity.filteredData(filter);
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