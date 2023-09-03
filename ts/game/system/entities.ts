
import { game } from 'game'	
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { ChildPredicate } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { EntityMap } from 'game/system/entity_map'

export class Entities extends SystemBase implements System {

	private _lastId : number;
	private _lastOfflineId : number;
	private _idToType : Map<number, EntityType>;
	private _deletedIds : Set<number>;

	constructor() {
		super(SystemType.ENTITIES);

		this.addNameParams({
			base: "entities",
		});

		this._lastId = 0;
		this._lastOfflineId = 0;
		this._idToType = new Map();
		this._deletedIds = new Set();

		this.setFactoryFn((entityType : EntityType) => { return this.addMap(new EntityMap(entityType)); })
	}

	addMap(map : EntityMap) : EntityMap { return this.registerChild<EntityMap>(map.entityType(), map); }
	hasMap(type : EntityType) : boolean { return this.hasChild(type); }
	getMap(type : EntityType) : EntityMap { return this.getChild<EntityMap>(type); }

	addEntity<T extends Entity>(type : EntityType, entityOptions : EntityOptions) : [T, boolean] {
		if (!EntityFactory.hasCreateFn(type)) {
			console.error("Error: missing factory function for entity type %d", type);
			return [null, false];
		}

		if (entityOptions.offline) {
			entityOptions.id = this.nextOfflineId();
			return [this.addLocalObject<T>(EntityFactory.create<T>(type, entityOptions)), true];
		}

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
			return [null, false];
		}
		return [this.getMap(this._idToType.get(id)).getEntity<T>(id), true];
	}
	findEntities(predicate : ChildPredicate<Entity>) : Entity[] {
		let entities : Entity[] = [];
		this.execute<EntityMap>((map : EntityMap) => {
			entities.push(...map.findAll(predicate));
		});
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

	private nextId() : number { return ++this._lastId; }
	private nextOfflineId() : number { return ++this._lastOfflineId; }
}