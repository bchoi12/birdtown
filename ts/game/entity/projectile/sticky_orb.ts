
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { OrbBase } from 'game/entity/projectile/orb'
import { MaterialType } from 'game/factory/api'

export class StickyOrb extends OrbBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.STICKY_ORB, entityOptions);

		this._explosionType = EntityType.GOLDEN_EXPLOSION;
		this._sticky = true;
		this._ringMaterial = MaterialType.SHOOTER_YELLOW;
	}

	protected override glow() : number { return 0; }
}