import { game } from 'game'
import { ColorType } from 'game/color_repository'
import { ComponentType } from 'game/component'
import { EntityOptions, EntityType } from 'game/entity'
import { ArchBase } from 'game/entity/block/arch_base'
import { ModelType } from 'game/loader'

import { Cardinal, CardinalType } from 'util/cardinal'
import { defined } from 'util/common'

export class ArchRoom extends ArchBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ARCH_ROOM, entityOptions);

		this._profile.setDim({x: 12, y: 6});
		this.openings().addTypes([CardinalType.LEFT, CardinalType.RIGHT]);
	}

	override modelType() : ModelType { return ModelType.ARCH_ROOM; }

	override initialize() : void {
		super.initialize();

		if (!this._openings.anyBottom()) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM, {x: this._profile.dim().x, y: this.thickness() }),
			});
		} else {
			if (!this._openings.hasType(CardinalType.BOTTOM_LEFT)) {
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM_LEFT, {x: this._profile.dim().x / 2, y: this.thickness() }),
				});
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM_LEFT, {x: this.thickness(), y: this.thickness() }),
				});
			}
			if (!this._openings.hasType(CardinalType.BOTTOM_RIGHT)) {
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM_RIGHT, {x: this._profile.dim().x / 2, y: this.thickness() }),
				});
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM_RIGHT, {x: this.thickness(), y: this.thickness() }),
				});
			}
		}

		if (this._openings.hasType(CardinalType.RIGHT)) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.TOP_RIGHT, {x: this.thickness(), y: 1.5 }),
			});
		} else {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.RIGHT, {x: this.thickness(), y: this._profile.dim().y }),
			});
		}

		if (this._openings.hasType(CardinalType.LEFT)) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.TOP_LEFT, {x: this.thickness(), y: 1.5 }),
			});
		} else {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.LEFT, {x: this.thickness(), y: this._profile.dim().y }),
			});
		}
	}
}