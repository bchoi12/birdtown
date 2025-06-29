
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorCategory, ColorType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { CardinalDir } from 'util/cardinal'
import { Vec } from 'util/vector'

export class Cliff extends Block {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CLIFF, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_BROWN));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_BROWN));		
	}

	override meshType() : MeshType { return MeshType.CLIFF; }
	override meshOffset() : Vec { return {y: -this.profile().dim().y / 2}; }
	override thickness() : number { return 0.5; }

	override initialize() : void {
		super.initialize();

		this.addFloor(
			this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x, y: this.thickness() }));
	}

	protected addFloor(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.FLOOR, {
			hexColorsInit: {
				color: this._hexColors.color(ColorCategory.SECONDARY),
			},
			profileInit: profileInit,
		});
	}
}