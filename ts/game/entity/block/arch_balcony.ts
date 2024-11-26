import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ArchBase } from 'game/entity/block/arch_base'
import { ColorCategory, MeshType } from 'game/factory/api'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'

export class ArchBalcony extends ArchBase implements Entity {

	private static readonly _sideWallScale = 0.8;

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

		if (this.openings().anyLeft()) {
			this._model.onLoad((model : Model) => {
				model.mesh().position.x = -this._profile.dim().x / 2;
				model.mesh().rotation.y = Math.PI / 2;
			});

			this.addFloor(
				this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {
					x: this._profile.dim().x,
					y: this.thickness(),
				}, {
					x: -0.1,
				}));
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.RIGHT, {
					x: ArchBalcony._sideWallScale * this.thickness(),
					y: this._profile.dim().y }));

		} else if (this.openings().anyRight()) {
			this._model.onLoad((model : Model) => {
				model.mesh().position.x = this._profile.dim().x / 2;
				model.mesh().rotation.y = -Math.PI / 2;
			});

			// Add thickness as buffer to prevent gaps.
			this.addFloor(
				this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {
					x: this._profile.dim().x,
					y: this.thickness(),
				}, {
					x: 0.1,
				}));
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.LEFT, {
					x: ArchBalcony._sideWallScale * this.thickness(),
					y: this._profile.dim().y }));
		}
	}
}