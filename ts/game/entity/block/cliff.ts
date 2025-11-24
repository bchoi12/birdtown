
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { CardinalDir } from 'util/cardinal'
import { SeededRandom } from 'util/seeded_random'
import { Vec } from 'util/vector'

export abstract class CliffBase extends Block {

	protected static readonly _floorDepth = 16;
	protected static readonly _waterFloorDepth = 40;

	protected _rng : SeededRandom;
	protected _mirrored : boolean;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._rng = new SeededRandom(this.id());
		if (entityOptions.seed) {
			this._rng.seed(Math.abs(entityOptions.seed));
		}
		this._mirrored = entityOptions.seed < 0;
	}

	abstract override meshType() : MeshType;
	override meshOffset() : Vec { return {y: -this.profile().dim().y / 2}; }
	override thickness() : number { return 0.75; }
}

export abstract class Cliff extends CliffBase {

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.CLIFF);
	}

	override meshType() : MeshType { return MeshType.CLIFF; }
}

export abstract class MiniCliff extends CliffBase {
	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.MINI_CLIFF);
	}

	override meshType() : MeshType { return MeshType.MINI_CLIFF; }
}

export abstract class CliffWall extends CliffBase {
	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.CLIFF_WALL);
	}

	override meshType() : MeshType { return MeshType.CLIFF_WALL; }

	override initialize() : void {
		super.initialize();

		this.addTrackedEntity(EntityType.BOUND, {
			profileInit: {
				pos: this._profile.pos(),
				dim: {
					x: this._profile.dim().x,
					y: this._profile.dim().y,
				},
			},
		})

	}
}