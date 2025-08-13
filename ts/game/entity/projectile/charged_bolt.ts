
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BoltBase } from 'game/entity/projectile/bolt'
import { MaterialType } from 'game/factory/api'

export class ChargedBolt extends BoltBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CHARGED_BOLT, entityOptions);

		this._glow = 0.7;
	}

	protected override onHit(other : Entity) : void {
		super.onHit(other);

		this.explode(EntityType.BOLT_EXPLOSION, {});
		this.delete();
	}

	override onMiss() : void {
		this.explode(EntityType.BOLT_EXPLOSION, {});
	}
}