import { game } from 'game'	
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { EntitiesBase } from 'game/system/entities_base'
import { EntityMap } from 'game/system/entity_map'
import { System, SystemType } from 'game/system'

export class Entities extends EntitiesBase implements System {
	constructor() {
		super(SystemType.ENTITIES);

		this.setName({
			base: "entities",
		});
		this.setFactoryFn((entityType : EntityType) => { this.addMap(new EntityMap(entityType)); })
	}
}