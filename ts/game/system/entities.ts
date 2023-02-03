import { game } from 'game'	
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { EntityFactory } from 'game/entity_factory'
import { System, SystemBase, SystemType } from 'game/system'
import { EntityMap } from 'game/system/entity_map'

export class Entities extends SystemBase implements System {
	private _lastId : number;
	private _idToType : Map<number, EntityType>;

	constructor() {
		super(SystemType.ENTITIES);

		this.setName({
			base: "entities",
		})

		this.reset();
		this.setFactoryFn((entityType : EntityType) => { this.addMap(new EntityMap(entityType)); })
	}

	override reset() : void {
		super.reset();
		this._lastId = 0;
		this._idToType = new Map();

		this.children().forEach((_, id : number) => {
			this.unregisterMap(id);
		});
	}

	override onNewClient(name : string, clientId : number) : void {
    	this.addEntity(EntityType.PLAYER, {
    		clientId: clientId,
    		profileInit: {
	    		pos: {x: 0, y: 10},
    		},
    	});
	}

	addMap(map : EntityMap) : EntityMap { return this.addChild<EntityMap>(map.entityType(), map); }
	hasMap(type : EntityType) : boolean { return this.hasChild(type); }
	getMap(type : EntityType) : EntityMap { return this.getChild<EntityMap>(type); }
	unregisterMap(type : EntityType) : void { this.unregisterChild(type); }

	addEntity(type : EntityType, entityOptions : EntityOptions) : void {
		if (!entityOptions.id) {
			// Only allow source to create new objects. Other objects are from data import
			if (!this.isSource()) {
				return;
			}
			entityOptions.id = this.nextId();
		} else {
			this._lastId = Math.max(this._lastId, entityOptions.id);
		}

		if (this._idToType.has(entityOptions.id)) {
			console.error("Warning: overwriting object type %d (previous: %d), id %d", type, this._idToType.get(entityOptions.id), entityOptions.id);
		}

		if (!EntityFactory.hasType(type)) {
			console.error("Error: missing factory function for entity type %d", type);
		}

		let entity = EntityFactory.create(type, entityOptions);
		this._idToType.set(entityOptions.id, type);

		if (!this.hasMap(type)) {
			this.addMap(new EntityMap(type));
		}

		this.getMap(type).addEntity(entity);
		
		if (entityOptions.onCreateFn) {
			entityOptions.onCreateFn(entity);
		}
	}

	hasEntity(id : number) : boolean { return this._idToType.has(id); }
	getEntity<T extends Entity>(id : number) : T {
		if (!this._idToType.has(id)) {
			console.error("Warning: queried for nonexistent ID", id);
			return null;
		}
		return this.getMap(this._idToType.get(id)).getEntity<T>(id);
	}
	unregisterEntity(id : number) : void {
		if (!this._idToType.has(id)) {
			return;
		}

		this.getMap(this._idToType.get(id)).unregisterEntity(id);
		this._idToType.delete(id);
	}

	private nextId() : number { return ++this._lastId; }
}