import { game } from 'game'	
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { EntityFactory } from 'game/factory/entity_factory'
import { System, SystemBase, SystemType } from 'game/system'
import { EntityMap, EntityMapQuery } from 'game/system/entity_map'

export type EntitiesQuery<T extends Entity> = {
	type? : EntityType;
	mapQuery : EntityMapQuery<T>;
}

export abstract class EntitiesBase extends SystemBase implements System {
	protected _lastId : number;
	protected _idToType : Map<number, EntityType>;

	constructor(type : SystemType) {
		super(type);

		this.setName({
			base: "entities_base",
		});

		this.reset();
		this.setFactoryFn((entityType : EntityType) => { this.addMap(new EntityMap(entityType)); })
	}

	override reset() : void {
		super.reset();
		this._lastId = 0;
		this._idToType = new Map();

		this.getChildren().forEach((_, id : number) => {
			this.unregisterMap(id);
		});
	}

	addMap(map : EntityMap) : EntityMap { return this.addChild<EntityMap>(map.entityType(), map); }
	hasMap(type : EntityType) : boolean { return this.hasChild(type); }
	getMap(type : EntityType) : EntityMap { return this.getChild<EntityMap>(type); }
	unregisterMap(type : EntityType) : void { this.unregisterChild(type); }

	addEntity<T extends Entity>(type : EntityType, entityOptions : EntityOptions) : [T, boolean] {
		if (!entityOptions.id) {
			// Only allow source to create new objects unless offline. Other objects are from data import
			if (!this.isSource() && !this.isOffline()) {
				return [null, false];
			}
			entityOptions.id = this.nextId();
		} else {
			this._lastId = Math.max(this._lastId, entityOptions.id);
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
	getEntity<T extends Entity>(id : number) : T {
		if (!this._idToType.has(id)) {
			console.error("Warning: queried for nonexistent ID", id);
			return null;
		}
		return this.getMap(this._idToType.get(id)).getEntity<T>(id);
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
		this.getMap(this._idToType.get(id)).deleteEntity(id);
	}
	unregisterEntity(id : number) : void {
		if (!this._idToType.has(id)) {
			return;
		}

		this.getMap(this._idToType.get(id)).unregisterEntity(id);
		this._idToType.delete(id);
	}

	protected nextId() : number { return ++this._lastId; }
}