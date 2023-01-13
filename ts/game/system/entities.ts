import { game } from 'game'	
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Explosion } from 'game/entity/explosion'
import { Player } from 'game/entity/player'
import { Rocket } from 'game/entity/projectile/rocket'
import { Wall } from 'game/entity/wall'
import { Bazooka } from 'game/entity/weapon/bazooka'
import { System, SystemBase, SystemType } from 'game/system'
import { EntityMap } from 'game/system/entity_map'

type EntityFactoryFn = (options : EntityOptions) => Entity;

export class Entities extends SystemBase implements System {
	private _lastId : number;
	private _idToType : Map<number, EntityType>;
	private _entityFactory : Map<EntityType, EntityFactoryFn>;

	constructor() {
		super(SystemType.ENTITIES);

		this._lastId = 0;
		this._idToType = new Map();
		this._entityFactory = new Map();
		this._entityFactory.set(EntityType.BAZOOKA, (options : EntityOptions) => { return new Bazooka(options); });
		this._entityFactory.set(EntityType.EXPLOSION, (options : EntityOptions) => { return new Explosion(options); });
		this._entityFactory.set(EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); });
		this._entityFactory.set(EntityType.ROCKET, (options : EntityOptions) => { return new Rocket(options); });
		this._entityFactory.set(EntityType.WALL, (options : EntityOptions) => { return new Wall(options); });

		this.setFactoryFn((entityType : EntityType) => { return new EntityMap(entityType); })
	}

	addMap(map : EntityMap) { this.addChild<EntityMap>(map.entityType(), map); }
	hasMap(type : EntityType) { return this.hasChild(type); }
	getMap(type : EntityType) : EntityMap { return this.getChild<EntityMap>(type); }

	addEntity(type : EntityType, entityOptions? : EntityOptions) : Entity {
		if (!entityOptions) {
			entityOptions = {};
		}

		if (!entityOptions.id) {
			entityOptions.id = this.nextId();
		}

		if (this._idToType.has(entityOptions.id)) {
			console.error("Warning: overwriting object type " + type + ", id " + entityOptions.id);
		}

		let entity = this._entityFactory.get(type)(entityOptions);
		this._idToType.set(entityOptions.id, type);

		if (!this.hasMap(type)) {
			this.addMap(new EntityMap(type));
		}

		this.getMap(type).addEntity(entity);
		return entity;
	}

	hasEntity(id : number) : boolean { return this._idToType.has(id); }
	getEntity(id : number) : Entity {
		if (!this._idToType.has(id)) {
			console.error("Warning: queried for nonexistent ID", id);
			return null;
		}
		return this.getMap(this._idToType.get(id)).getEntity(id);
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