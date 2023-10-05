
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorType } from 'game/factory/color_factory'

export abstract class ArchBase extends Block {

	protected static readonly _doorHeight = 1.5;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._allTypes.add(EntityType.ARCH_BASE);
	}

	override thickness() : number { return 0.5; }
	override ready() { return super.ready() && this.hasOpenings() && this._hexColors.hasColor(ColorType.BASE) && this._hexColors.hasColor(ColorType.SECONDARY); }
}