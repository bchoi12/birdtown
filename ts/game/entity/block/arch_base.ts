import { ColorType } from 'game/factory/color_factory'
import { EntityOptions, EntityType } from 'game/entity'
import { Block } from 'game/entity/block'

export abstract class ArchBase extends Block {

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._allTypes.add(EntityType.ARCH_BASE);
	}

	override thickness() : number { return 0.5; }
	override ready() { return super.ready() && this.hasOpenings() && this._hexColors.hasColor(ColorType.BASE) && this._hexColors.hasColor(ColorType.SECONDARY); }
}