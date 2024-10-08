
import { game } from 'game'	
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { ChildPredicate } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { EntityMap } from 'game/system/entity_map'

type EntityInfo = {
	type : EntityType;
	allTypes? : Set<EntityType>;
}

enum IdType {
	NORMAL,
	OFFLINE,
}

export class Entities extends SystemBase implements System {

	private _lastId : Map<IdType, number>;
	private _entityInfo : Map<number, EntityInfo>;
	private _deletedIds : Set<number>;

	constructor() {
		super(SystemType.ENTITIES);

		this._lastId = new Map([
			[IdType.NORMAL, 0],
			[IdType.OFFLINE, -1],
		]);
		this._entityInfo = new Map();
		this._deletedIds = new Set();

		this.setFactoryFn((entityType : EntityType) => { return this.addMap(new EntityMap(entityType)); })
	}

	addMap(map : EntityMap) : EntityMap { return this.registerChild<EntityMap>(map.entityType(), map); }
	hasMap(type : EntityType) : boolean { return this.hasChild(type); }
	getMap(type : EntityType) : EntityMap {
		if (!this.hasMap(type)) {
			this.addMap(new EntityMap(type));
		}
		return this.getChild<EntityMap>(type);
	}

	addEntity<T extends Entity>(type : EntityType, entityOptions : EntityOptions) : [T, boolean] {
		if (!EntityFactory.hasCreateFn(type)) {
			console.error("Error: missing factory function for %s", EntityType[type]);
			return [null, false];
		}

		const idType = entityOptions.offline ? IdType.OFFLINE : IdType.NORMAL;
		if (!entityOptions.id) {
			entityOptions.id = this.nextId(idType);
		} else {
			this.updateLastId(idType, entityOptions.id);
		}

		if (this._deletedIds.has(entityOptions.id)) {
			return [null, false];
		}

		if (this._entityInfo.has(entityOptions.id)) {
			console.error("Warning: overwriting %s object, id %d, previous: ", EntityType[type], entityOptions.id, this._entityInfo.get(entityOptions.id));
		}

		let entity = EntityFactory.create<T>(type, entityOptions);
		if (entity.allTypes().size === 0) {
			console.error("Error: created entity with no types", entity);
			return [null, false];
		}

		// TODO: also add mapping entries for AllTypes to support queries?
		this._entityInfo.set(entityOptions.id, {
			type: type,
			allTypes: entity.allTypes(),
		});
		if (!this.hasMap(type)) {
			this.addMap(new EntityMap(type));
		}
		this.getMap(type).createEntity(entity);
		return [entity, true];
	}

	hasEntity(id : number) : boolean { return this._entityInfo.has(id); }
	getEntity<T extends Entity>(id : number) : [T, boolean] {
		if (!this._entityInfo.has(id)) {
			return [null, false];
		}
		const type = this._entityInfo.get(id).type;
		return [this.getMap(type).getEntity<T>(id), true];
	}
	isDeleted(id : number) : boolean { return this._deletedIds.has(id); }

	findEntities(predicate : ChildPredicate<Entity>) : Entity[] {
		let entities : Entity[] = [];
		this.execute<EntityMap>((map : EntityMap) => {
			entities.push(...map.findAll(predicate));
		});
		return entities;
	}
	deleteEntity(id : number) : void {
		if (!this._entityInfo.has(id)) {
			return;
		}
		this._deletedIds.add(id);
		const type = this._entityInfo.get(id).type;
		this.getMap(type).deleteEntity(id);
	}
	unregisterEntity(id : number) : void {
		if (!this._entityInfo.has(id)) {
			return;
		}

		this._deletedIds.add(id);
		const type = this._entityInfo.get(id).type;
		this.getMap(type).unregisterEntity(id);
		this._entityInfo.delete(id);
	}

	private updateLastId(type : IdType, id : number) : void {
		this._lastId.set(type, Math.max(id, this._lastId.get(type)));
	}
	private nextId(type : IdType) : number {
		this._lastId.set(type, this._lastId.get(type) + 2);
		return this._lastId.get(type);
	}
}