
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorCategory } from 'game/factory/api'

import { Vec } from 'util/vector'

export abstract class ArchBase extends Block {

	protected static readonly _doorHeight = 1.5;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._allTypes.add(EntityType.ARCH_BLOCK);
	}

	override meshOffset() : Vec { return {y: -this.profile().dim().y / 2}; }
	override thickness() : number { return 0.5; }
	override ready() { return super.ready() && this.hasOpenings() && this._hexColors.hasColor(ColorCategory.BASE) && this._hexColors.hasColor(ColorCategory.SECONDARY); }

	protected addWall(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.BOUND, {
			profileInit: profileInit,
		});
	}

	protected addFloor(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.FLOOR, {
			profileInit: profileInit,
		});
	}
}