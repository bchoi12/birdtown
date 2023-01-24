import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityOptions, EntityType } from 'game/entity'
import { Block } from 'game/entity/block'
import { loader, LoadResult, ModelType } from 'game/loader'
import { BodyCreator } from 'game/util/body_creator'

import { Cardinal, CardinalType } from 'util/cardinal'
import { defined } from 'util/common'
import { HexColor } from 'util/hex_color'
import { Vec, Vec2 } from 'util/vector'

export class ArchBlock extends Block {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ARCH_BLOCK, entityOptions);

		this._profile.setDim({x: 12, y: 6});
		this.openings().addTypes([CardinalType.LEFT, CardinalType.RIGHT]);
	}

	modelType() : ModelType { return ModelType.ARCH_BASE; }
	thickness() : number { return 0.5; }

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