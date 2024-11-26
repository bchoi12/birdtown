import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ArchBase } from 'game/entity/block/arch_base'
import { ColorCategory, MeshType } from 'game/factory/api'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'

export class ArchRoof extends ArchBase implements Entity {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ARCH_ROOF, entityOptions);
	}

	override meshType() : MeshType { return MeshType.ARCH_ROOF; }
	override initialize() : void {
		super.initialize();

		let length = this._profile.dim().x;

		if (!this.openings().hasDir(CardinalDir.RIGHT)) {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.RIGHT, {x: this.thickness(), y: this._profile.dim().y }));
		}

		if (!this.openings().hasDir(CardinalDir.LEFT)) {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.LEFT, {x: this.thickness(), y: this._profile.dim().y }));
		}

		if (!this.openings().hasDir(CardinalDir.LEFT) && !this.openings().hasDir(CardinalDir.RIGHT)) {
			this.addFloor(
				this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x - this.thickness(), y: this.thickness() }));
		} else if (!this.openings().hasDir(CardinalDir.LEFT)) {
			this.addFloor(
				this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this._profile.dim().x - this.thickness() / 2, y: this.thickness() }));
		} else if (!this.openings().hasDir(CardinalDir.RIGHT)) {
			this.addFloor(
				this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this._profile.dim().x - this.thickness() / 2, y: this.thickness() }));
		} else {
			this.addFloor(
				this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x, y: this.thickness() }));
		}
	}
}