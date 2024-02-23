
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorType } from 'game/factory/api'

export abstract class ArchBase extends Block {

	protected static readonly _doorHeight = 1.5;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._allTypes.add(EntityType.ARCH_BLOCK);
	}

	override thickness() : number { return 0.5; }
	override ready() { return super.ready() && this.hasOpenings() && this._hexColors.hasColor(ColorType.BASE) && this._hexColors.hasColor(ColorType.SECONDARY); }

	protected addWall(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.WALL, {
			hexColorsInit: {
				color: this._hexColors.color(ColorType.BASE),
			},
			profileInit: profileInit,
		});
	}

	protected addFloor(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.FLOOR, {
			hexColorsInit: {
				color: this._hexColors.color(ColorType.SECONDARY),
			},
			profileInit: profileInit,
		});
	}
}