
import { AttributeType } from 'game/component/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BoltBase } from 'game/entity/projectile/bolt'
import { MaterialType } from 'game/factory/api'

export class PurpleBolt extends BoltBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PURPLE_BOLT, entityOptions);

		this._glow = 0.6;
	}

	protected override materialType() : MaterialType {
		return MaterialType.SHOOTER_PURPLE;
	}

	protected override onHit(other : Entity) : void {
		super.onHit(other);

		this.explode(EntityType.PURPLE_BOLT_EXPLOSION, {});
		this.delete();
	}

	override onMiss() : void {
		this.explode(EntityType.PURPLE_BOLT_EXPLOSION, {});
	}
}