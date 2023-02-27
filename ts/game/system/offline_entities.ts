
import { NetworkBehavior } from 'game/core'

import { Entity, EntityOptions, EntityType } from 'game/entity'
import { EntitiesBase } from 'game/system/entities_base'
import { System, SystemType } from 'game/system'

export class OfflineEntities extends EntitiesBase implements System {
	constructor() {
		super(SystemType.OFFLINE_ENTITIES);

		this.setName({
			base: "offline_entities",
		});
	}

	override networkBehavior() { return NetworkBehavior.OFFLINE; }
}