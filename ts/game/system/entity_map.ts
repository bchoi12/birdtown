import { game } from 'game'	
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'

export class EntityMap extends SystemBase implements System {
	private _entityType : EntityType;

	constructor(entityType : EntityType) {
		super(SystemType.ENTITY_MAP);

		this._entityType = entityType;

		this.setFactoryFn((id : number) => { return game.entities().addEntity(this._entityType, {id: id}) });
	}

	entityType() : EntityType { return this._entityType; }

	addEntity(entity : Entity) : Entity { return this.addChild<Entity>(entity.id(), entity); }
	hasEntity(id : number) : boolean { return this.hasChild(id); }
	getEntity(id : number) : Entity { return this.getChild<Entity>(id); }
	unregisterEntity(id : number) : void { this.unregisterChild(id); }
}
		