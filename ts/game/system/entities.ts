import { game } from 'game'	
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { EntityFactory } from 'game/factory/entity_factory'
import { System, SystemBase, SystemType } from 'game/system'
import { EntityMap, EntityMapQuery } from 'game/system/entity_map'

export type EntitiesQuery<T extends Entity> = {
	type? : EntityType;
	mapQuery : EntityMapQuery<T>;
}

export class Entities extends SystemBase implements System {

	private _lastId : number;
	private _idToType : Map<number, EntityType>;
	private _deletedIds : Set<number>;

	constructor() {
		super(SystemType.ENTITIES);

		this.setName({
			base: "entities",
		});

		this._lastId = 0;
		this._idToType = new Map();
		this._deletedIds = new Set();

		this.setFactoryFn((entityType : EntityType) => { return this.addMap(new EntityMap(entityType)); })
	}

	addMap(map : EntityMap) : EntityMap { return this.registerChild<EntityMap>(map.entityType(), map); }
	hasMap(type : EntityType) : boolean { return this.hasChild(type); }
	getMap(type : EntityType) : EntityMap { return this.getChild<EntityMap>(type); }
	unregisterMap(type : EntityType) : void { this.unregisterChild(type); }

	addEntity<T extends Entity>(type : EntityType, entityOptions : EntityOptions) : [T, boolean] {
		if (!entityOptions.id) {
			// Only allow source to create new objects
			if (!this.isSource()) {
				return [null, false];
			}
			entityOptions.id = this.nextId();
		} else {
			this._lastId = Math.max(this._lastId, entityOptions.id);
		}

		if (this._deletedIds.has(entityOptions.id)) {
			return [null, false];
		}

		if (this._idToType.has(entityOptions.id)) {
			console.error("Warning: overwriting object type %d (previous: %d), id %d", type, this._idToType.get(entityOptions.id), entityOptions.id);
		}

		if (!EntityFactory.hasCreateFn(type)) {
			console.error("Error: missing factory function for entity type %d", type);
		}

		let entity = EntityFactory.create<T>(type, entityOptions);
		this._idToType.set(entityOptions.id, type);

		if (!this.hasMap(type)) {
			this.addMap(new EntityMap(type));
		}
		this.getMap(type).addEntity(entity);
		
		return [entity, true];
	}

	hasEntity(id : number) : boolean { return this._idToType.has(id); }
	getEntity<T extends Entity>(id : number) : [T, boolean] {
		if (!this._idToType.has(id)) {
			console.error("Warning: queried for nonexistent ID", id);
			return [null, false];
		}
		return [this.getMap(this._idToType.get(id)).getEntity<T>(id), true];
	}
	queryEntities<T extends Entity>(query : EntitiesQuery<T>) : T[] {
		if (query.type) {
			if (!this.hasMap(query.type)) {
				return [];
			}
			return this.getMap(query.type).queryEntities(query.mapQuery);
		}

		const order = this.childOrder();
		let entities = [];
		for (let i = 0; i < order.length; ++i) {
			const map = this.getMap(order[i]);

			map.queryEntities(query.mapQuery).forEach((t : T) => {
				entities.push(t);
			});
		}
		return entities;
	}
	deleteEntity(id : number) : void {
		if (!this._idToType.has(id)) {
			return;
		}
		this._deletedIds.add(id);
		this.getMap(this._idToType.get(id)).deleteEntity(id);
	}
	unregisterEntity(id : number) : void {
		if (!this._idToType.has(id)) {
			return;
		}

		this._deletedIds.add(id);
		this.getMap(this._idToType.get(id)).unregisterEntity(id);
		this._idToType.delete(id);
	}

	protected nextId() : number { return ++this._lastId; }
}