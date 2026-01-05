
import { AttributeType, TeamType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { EntityType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { Bird } from 'game/entity/bird'

export abstract class Bot extends Bird {

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BOT);

		this.setTeam(TeamType.ENEMY);
	}

	override displayName() : string { return "Bot"; }
}