import { game } from 'game'
import { ColorType } from 'game/factory/color_factory'
import { ComponentType } from 'game/component/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ArchBase } from 'game/entity/block/arch_base'
import { MeshType } from 'game/factory/api'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'

export class ArchRoof extends ArchBase implements Entity {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ARCH_ROOF, entityOptions);

		this.addNameParams({
			base: "arch_roof",
			id: this.id(),
		});
	}

	override meshType() : MeshType { return MeshType.ARCH_ROOF; }
	override initialize() : void {
		super.initialize();

		if (!this.openings().anyBottom()) {
			this.addTrackedEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x - 1e-2, y: this.thickness() }),
			});
		} else {
			if (!this.openings().hasDir(CardinalDir.BOTTOM_LEFT)) {
				this.addTrackedEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this._profile.dim().x / 2, y: this.thickness() }),
				});
				this.addTrackedEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this.thickness(), y: this.thickness() }),
				});
			}
			if (!this.openings().hasDir(CardinalDir.BOTTOM_RIGHT)) {
				this.addTrackedEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this._profile.dim().x / 2, y: this.thickness() }),
				});
				this.addTrackedEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this.thickness(), y: this.thickness() }),
				});
			}
		}

		if (!this.openings().hasDir(CardinalDir.RIGHT)) {
			this.addTrackedEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalDir.RIGHT, {x: this.thickness(), y: this._profile.dim().y }),
			});
		}

		if (!this.openings().hasDir(CardinalDir.LEFT)) {
			this.addTrackedEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalDir.LEFT, {x: this.thickness(), y: this._profile.dim().y }),
			});
		}
	}
}