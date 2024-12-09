
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorCategory, ColorType, DepthType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { Vec } from 'util/vector'

export class Bush extends Block {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BUSH, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.color(ColorType.GREEN).toHex());
	}

	override initialize() : void {
		super.initialize();

		this._profile.setMinimapOptions({
			color: this._hexColors.color(ColorCategory.BASE).toString(),
			depthType: DepthType.FRONT,
		});
	}

	override meshType() : MeshType { return MeshType.BUSH; }
	override thickness() : number { return 0; }
}