
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorType, DepthType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { Vec } from 'util/vector'

export class Billboard extends Block {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BILLBOARD, entityOptions);

		this._hexColors.setColor(ColorType.BASE, ColorFactory.archWhite.toHex());
	}

	override initialize() : void {
		super.initialize();

		this._profile.onBody((profile : Profile) => {
			profile.body().render.fillStyle = this._hexColors.color(ColorType.BASE).toString();
			profile.body().render.strokeStyle = this._hexColors.color(ColorType.BASE).toString();
			profile.body().plugin.zIndex = DepthType.FRONT;
		});
	}

	override meshType() : MeshType { return MeshType.BILLBOARD; }
	override thickness() : number { return 0; }
}