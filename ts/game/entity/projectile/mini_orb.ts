
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { OrbBase } from 'game/entity/projectile/orb'
import { MaterialType } from 'game/factory/api'

export class MiniOrb extends OrbBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.MINI_ORB, entityOptions);

		this._explosionType = EntityType.MINI_ORB_EXPLOSION;
		this._ringMaterial = MaterialType.SHOOTER_YELLOW;
	}

	protected override glow() : number { return 0; }
}