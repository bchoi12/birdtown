import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ArchBase } from 'game/entity/block/arch_base'
import { ColorCategory, MeshType } from 'game/factory/api'

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
				pos: this._profile.pos(),
				dim: this._profile.dim(),
			});
			return;
		}

		if (!this.openings().anyBottom()) {
			this.addFloor(
				this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x, y: this.thickness() }));
		} else {
			if (!this.openings().hasDir(CardinalDir.BOTTOM_LEFT)) {
				this.addFloor(
					this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this._profile.dim().x / 2, y: this.thickness() }));
				this.addFloor(
					this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: this.thickness(), y: this.thickness() }));
			}
			if (!this.openings().hasDir(CardinalDir.BOTTOM_RIGHT)) {
				this.addFloor(
					this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this._profile.dim().x / 2, y: this.thickness() }));
				this.addFloor(
					this._profile.createRelativeInit(CardinalDir.BOTTOM_RIGHT, {x: this.thickness(), y: this.thickness() }));
			}
		}

		if (this.openings().hasDir(CardinalDir.RIGHT)) {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.TOP_RIGHT, {x: this.thickness(), y: ArchBase._doorHeight }));
		} else {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.RIGHT, {x: this.thickness(), y: this._profile.dim().y }));
		}

		if (this.openings().hasDir(CardinalDir.LEFT)) {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.TOP_LEFT, {x: this.thickness(), y: ArchBase._doorHeight }));
		} else {
			this.addWall(
				this._profile.createRelativeInit(CardinalDir.LEFT, {x: this.thickness(), y: this._profile.dim().y }));
		}
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (!this.openings().empty()) {
			return;
		}

		if (!other.allTypes().has(EntityType.PLAYER)) {
			return;
		}

		// Prevent stuck glitches
		const otherPos = other.profile().body().position;
		if (this._profile.contains(otherPos)) {
			other.profile().forcePos({
				x: otherPos.x,
				y: otherPos.y + 1,
			});
		}
	}
}