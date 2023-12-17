import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ArchBase } from 'game/entity/block/arch_base'
import { ColorType, MeshType } from 'game/factory/api'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'

export class ArchBalcony extends ArchBase implements Entity {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ARCH_BALCONY, entityOptions);
	}

	override meshType() : MeshType { return MeshType.ARCH_BALCONY; }
	override initialize() : void {
		super.initialize();

		if (!this.openings().anyLeft() && !this.openings().anyRight()) {
			console.error("Error: balcony has invalid openings:", this.openings());
			this.delete();
			return;
		}

		this.addTrackedEntity(EntityType.WALL, {
			profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.scaledDim().x, y: this.thickness() }),
		});

		if (this.openings().anyLeft()) {
			this._model.offlineTransforms().translation().x = -this._profile.scaledDim().x / 2;
			this._model.offlineTransforms().rotation().y = Math.PI / 2;

			this.addTrackedEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalDir.RIGHT, {x: this.thickness() / 2, y: this._profile.scaledDim().y }),
			});

		} else if (this.openings().anyRight()) {
			this._model.offlineTransforms().translation().x = this._profile.scaledDim().x / 2;
			this._model.offlineTransforms().rotation().y = -Math.PI / 2;

			this.addTrackedEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalDir.LEFT, {x: this.thickness() / 2, y: this._profile.scaledDim().y }),
			});
		}
	}
}