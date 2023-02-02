import { game } from 'game'
import { ColorType } from 'game/color_repository'
import { ComponentType } from 'game/component'
import { EntityOptions, EntityType } from 'game/entity'
import { Block } from 'game/entity/block'
import { ModelType } from 'game/loader'

import { Cardinal, CardinalType } from 'util/cardinal'
import { defined } from 'util/common'

export abstract class ArchBase extends Block {

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._allTypes.add(EntityType.ARCH_BASE);
	}

	override thickness() : number { return 0.5; }
	override ready() { return super.ready() && this._hexColors.hasColor(ColorType.BASE) && this._hexColors.hasColor(ColorType.SECONDARY); }
}