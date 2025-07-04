
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { CardinalDir } from 'util/cardinal'
import { Vec } from 'util/vector'

abstract class CliffBase extends Block {
	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);
	}

	abstract override meshType() : MeshType;
	override meshOffset() : Vec { return {y: -this.profile().dim().y / 2}; }
	override thickness() : number { return 0.75; }
}

export abstract class Cliff extends CliffBase {

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.allTypes().add(EntityType.CLIFF);
	}

	override meshType() : MeshType { return MeshType.CLIFF; }
}

export abstract class MiniCliff extends CliffBase {
	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.allTypes().add(EntityType.MINI_CLIFF);
	}

	override meshType() : MeshType { return MeshType.MINI_CLIFF; }
}