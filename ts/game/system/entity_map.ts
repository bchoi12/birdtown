import { game } from 'game'	
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

export type EntityFilter<T extends Entity> = (entity : T) => boolean;
export type EntityMapQuery<T extends Entity> = {
	filter? : EntityFilter<T>;
	limit? : number;
}

export class EntityMap extends SystemBase implements System {
	private _entityType : EntityType;

	constructor(entityType : EntityType) {
		super(SystemType.ENTITY_MAP);

		this._entityType = entityType;

		this.addNameParams({
			base: "entity_map",
			type: EntityType[entityType],
		})

		this.setFactoryFn((id : number) => {
			const [entity, _] = game.entities().addEntity(this._entityType, {id: id});
			return entity;
		});
	}

	override reset() : void {
		super.reset();

		this.execute<EntityMap>((_, id : number) => {
			this.unregisterEntity(id);
		})
	}

	entityType() : EntityType { return this._entityType; }

	addEntity<T extends Entity>(entity : T) : T {
		return this.registerChild<T>(entity.id(), entity);
	}
	hasEntity(id : number) : boolean { return this.hasChild(id); }
	getEntity<T extends Entity>(id : number) : T { return this.getChild<T>(id); }
	queryEntities<T extends Entity>(query : EntityMapQuery<T>) : T[] {
		return <T[]>this.findN<Entity>((entity : T) => {
			if (entity.deleted() || !entity.initialized()) {
				return false;
			}
			if (query.filter && !query.filter(entity)) {
				return false;
			}
		}, query.limit);
	}

	deleteEntity(id : number) : void {
		if (!this.hasEntity(id)) {
			return;
		}
		this.getEntity(id).delete();
	}
	unregisterEntity(id : number) : void { this.unregisterChild(id); }
}
		