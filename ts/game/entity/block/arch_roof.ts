import { game } from 'game'
import { ColorType } from 'game/factory/color_factory'
import { ComponentType } from 'game/component'
import { EntityOptions, EntityType } from 'game/entity'
import { ArchBase } from 'game/entity/block/arch_base'
import { ModelType } from 'game/loader'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'

export class ArchRoof extends ArchBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ARCH_ROOF, entityOptions);

		this._profile.setDim({x: 12, y: 1});
	}

	override modelType() : ModelType { return ModelType.ARCH_ROOF; }
	override initialize() : void {
		super.initialize();

		if (!this.openings().anyBottom()) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x, y: this.thickness() }),
			});
		} else {
			if (!this.openings().hasDir(CardinalDir.BOTTOM_LEFT)) {
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this._profile.dim().x / 2, y: this.thickness() }),
				});
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this.thickness(), y: this.thickness() }),
				});
			}
			if (!this.openings().hasDir(CardinalDir.BOTTOM_RIGHT)) {
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this._profile.dim().x / 2, y: this.thickness() }),
				});
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this.thickness(), y: this.thickness() }),
				});
			}
		}

		if (!this.openings().hasDir(CardinalDir.RIGHT)) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalDir.RIGHT, {x: this.thickness(), y: this._profile.dim().y }),
			});
		}

		if (!this.openings().hasDir(CardinalDir.LEFT)) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalDir.LEFT, {x: this.thickness(), y: this._profile.dim().y }),
			});
		}
	}
}