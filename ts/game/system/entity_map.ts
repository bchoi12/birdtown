import { game } from 'game'	
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'

export class EntityMap extends SystemBase implements System {
	private _entityType : EntityType;

	constructor(entityType : EntityType) {
		super(SystemType.ENTITY_MAP);

		this._entityType = entityType;

		this.setName({
			base: "entity_map",
			type: entityType,
		})

		this.setFactoryFn((id : number) => { game.entities().addEntity(this._entityType, {id: id}) });
	}

	override reset() : void {
		super.reset();

		this.children().forEach((_, id : number) => {
			this.unregisterEntity(id);
		});
	}

	entityType() : EntityType { return this._entityType; }

	addEntity(entity : Entity) : Entity {
		return this.addChild<Entity>(entity.id(), entity);
	}
	hasEntity(id : number) : boolean { return this.hasChild(id); }
	getEntity<T extends Entity>(id : number) : T { return this.getChild<T>(id); }
	unregisterEntity(id : number) : void { this.unregisterChild(id); }
}
		