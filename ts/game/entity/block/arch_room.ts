import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ArchBase } from 'game/entity/block/arch_base'
import { ColorType, MeshType } from 'game/factory/api'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'

export class ArchRoom extends ArchBase implements Entity {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ARCH_ROOM, entityOptions);
	}

	override meshType() : MeshType { return MeshType.ARCH_ROOM; }

	override initialize() : void {
		super.initialize();

		if (this.openings().empty()) {
			this.addWall({
				pos: this._profile.pos().clone().add({ y: this.thickness() / 2 }),
				dim: this._profile.scaledDim().clone().add({ y: this.thickness() }),
			});
			return;
		}

		if (!this.openings().anyBottom()) {
			this.addFloor(
				this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.scaledDim().x, y: this.thickness() }));
		} else {
			if (!this.openings().hasDir(CardinalDir.BOTTOM_LEFT)) {
				this.addFloor(
					this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this._profile.scaledDim().x / 2, y: this.thickness() }));
				this.addFloor(
					this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this.thickness(), y: this.thickness() }));
			}
			if (!this.openings().hasDir(CardinalDir.BOTTOM_RIGHT)) {
				this.addFloor(
					this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this._profile.scaledDim().x / 2, y: this.thickness() }));
				this.addFloor(
					this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this.thickness(), y: this.thickness() }));
			}
		}

		if (this.openings().hasDir(CardinalDir.RIGHT)) {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.TOP_RIGHT, {x: this.thickness(), y: ArchBase._doorHeight }));
		} else {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.RIGHT, {x: this.thickness(), y: this._profile.scaledDim().y }));
		}

		if (this.openings().hasDir(CardinalDir.LEFT)) {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.TOP_LEFT, {x: this.thickness(), y: ArchBase._doorHeight }));
		} else {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.LEFT, {x: this.thickness(), y: this._profile.scaledDim().y }));
		}
	}
}