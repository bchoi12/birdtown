
import { game } from 'game'
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { TimeType } from 'game/system/api'

import { CardinalDir } from 'util/cardinal'
import { Vec } from 'util/vector'

export class Tree extends Block {
	constructor(entityOptions : EntityOptions) {
		super(EntityType.TREE, entityOptions);

		if (this.isSource()) {
			const rand = Math.random();

			this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.TREE_BROWN));

			if (game.world().getTime() === TimeType.EVENING) {
				if (rand < 0.33) {
					this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.TREE_RED));
				} else if (rand < 0.66) {
					this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.TREE_ORANGE));
				} else {
					this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.TREE_YELLOW));
				}
			} else {
				if (rand < 0.25) {
					this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.TREE_LIGHT_GREEN));
				} else if (rand < 0.5) {
					this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.TREE_DARK_GREEN));
				} else if (rand > 0.97) {
					this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.TREE_RED));
				} else {
					this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.TREE_GREEN));
				}
			}
		}
	}

	override ready() : boolean { return super.ready() && this._hexColors.hasColor(ColorCategory.BASE) && this._hexColors.hasColor(ColorCategory.SECONDARY); }

	override meshType() : MeshType { return MeshType.TREE; }
	override meshOffset() : Vec { return { y: -this.profile().dim().y / 2 }; }
	override thickness() : number { return 0; }

	override initialize() : void {
		super.initialize();

		this._model.rotation().y = Math.random() * Math.PI;
	}

	override canOcclude() : boolean { return super.canOcclude() && this._model.root().position.z > 0; }
}