
import { game } from 'game'
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Cliff, CliffBase, MiniCliff, CliffWall } from 'game/entity/block/cliff'
import { ColorCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { TimeType } from 'game/system/api'

import { CardinalDir } from 'util/cardinal'
import { Vec } from 'util/vector'

export class BottomCliff extends Cliff {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOTTOM_CLIFF, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_GRAY));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_GRAY));		
	}

	override initialize() : void {
		super.initialize();

		this.addFloor(
			this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x, y: this.thickness(), z: CliffBase._waterFloorDepth }));

		if (game.world().getTime() === TimeType.NIGHT) {
			return;
		}

		const blocks = 2 + Math.ceil(2 * this._rng.next());

		const len = this._profile.initDim().x / blocks;
		const height = this._profile.initDim().y;
		for (let i = 0; i < blocks; ++i) {

			const x = len * i + 0.5 + (len - 1) * this._rng.next();
			const yRand = this._rng.next();
			const y = 0.5 + (height - 1.5) * yRand;

			this.addBlock({ x: x, y: y }, 0.5 + 2 * (1 - yRand));
		}
	}

	protected addBlock(pos : Vec, scale : number) : void {
		const dim = scale * this.thickness();
		const profileInit =
			this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: dim, y: dim, z: 5 }, {x: pos.x, y: pos.y });

		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				materialType: pos.y <= 3 ? MaterialType.CLIFF_DARK_GRAY : MaterialType.CLIFF_GRAY,
			},
		});
	}

	protected addFloor(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				transforms: {
					translate: { z: CliffBase._waterFloorDepth / 4 },
				},
				materialType: MaterialType.CLIFF_DARK_GRAY,
			},
		});
	}
}

export class BottomMiniCliff extends MiniCliff {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOTTOM_MINI_CLIFF, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_GRAY));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_GRAY));		
	}

	override initialize() : void {
		super.initialize();

		const blocks = 3;

		const len = this._profile.initDim().x / blocks;
		const height = this._profile.initDim().y / blocks;
		for (let i = 0; i < blocks; ++i) {
			let index = i;
			if (this._mirrored) {
				index = blocks - i - 1;
			}

			const x = len * index + 0.5 + (len - 1) * this._rng.next();
			const yRand = this._rng.next();
			const y = (index % 2) * height + 0.5 + (height - 1) * yRand;

			this.addBlock({ x: x, y: y }, 0.5 + (1 - yRand));
		}

		this.addFloor(
			this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x, y: this.thickness(), z: CliffBase._waterFloorDepth }));
	}

	protected addBlock(pos : Vec, scale : number) : void {
		const dim = scale * this.thickness();
		const profileInit =
			this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: dim, y: dim, z: 5 }, {x: pos.x, y: pos.y });

		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				materialType: pos.y <= 3 ? MaterialType.CLIFF_DARK_GRAY : MaterialType.CLIFF_GRAY,
			},
		});
	}

	protected addFloor(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				transforms: {
					translate: { z: CliffBase._waterFloorDepth / 4 },
				},
				materialType: MaterialType.CLIFF_DARK_GRAY,
			},
		});
	}
}

export class BottomCliffWall extends CliffWall {
	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOTTOM_CLIFF_WALL, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_GRAY));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_GRAY));		
	}

	override initialize() : void {
		super.initialize();

		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x, y: this.thickness(), z: CliffBase._waterFloorDepth }),
			modelInit: {
				transforms: {
					translate: { z: CliffBase._waterFloorDepth / 4 },
				},
				materialType: MaterialType.CLIFF_DARK_GRAY,
			},
		});
	}
}