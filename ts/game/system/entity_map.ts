import { game } from 'game'	
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'

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

		this.setName({
			base: "entity_map",
			type: entityType,
		})

		this.setFactoryFn((id : number) => { game.entities().addEntity(this._entityType, {id: id}) });
	}

	override reset() : void {
		super.reset();

		this.getChildren().forEach((_, id : number) => {
			this.unregisterEntity(id);
		});
	}

	entityType() : EntityType { return this._entityType; }

	addEntity<T extends Entity>(entity : T) : T {
		return this.addChild<T>(entity.id(), entity);
	}
	hasEntity(id : number) : boolean { return this.hasChild(id); }
	getEntity<T extends Entity>(id : number) : T { return this.getChild<T>(id); }
	queryEntities<T extends Entity>(query : EntityMapQuery<T>) : T[] {
		let entities = [];

		const order = this.childOrder();
		for (let i = 0; i < order.length; ++i) {
			const entity = this.getChild<T>(order[i]);

			if (query.filter && !query.filter(entity)) {
				continue;
			}

			entities.push(entity);
			if (query.limit && entities.length >= query.limit) {
				break;
			}
		}

		return entities;
	}
	unregisterEntity(id : number) : void { this.unregisterChild(id); }
}
		