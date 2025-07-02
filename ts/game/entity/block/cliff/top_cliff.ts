
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Cliff, MiniCliff } from 'game/entity/block/cliff'
import { ColorCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { CardinalDir } from 'util/cardinal'
import { Vec } from 'util/vector'

export class TopCliff extends Cliff {

	private static readonly _floorDepth = 8;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TOP_CLIFF, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_BROWN));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_BROWN));		
	}

	override initialize() : void {
		super.initialize();

		this.addPlatform(
			this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: 4, y: this.thickness(), z: 5 }, {x: 3, y: 3 }));

		this.addFloor(
			this._profile.createRelativeInit(CardinalDir.BOTTOM, {x: this._profile.dim().x, y: this.thickness(), z: TopCliff._floorDepth }));
	}

	protected addPlatform(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				materialType: MaterialType.CLIFF_LIGHT_BROWN,
			},
		});
	}

	protected addFloor(profileInit : ProfileInitOptions) : void {
		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				transforms: {
					translate: { z: TopCliff._floorDepth / 4 },
				},
				materialType: MaterialType.CLIFF_BROWN,
			},
		});
	}
}

export class TopMiniCliff extends MiniCliff {

	private static readonly _floorDepth = 8;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TOP_MINI_CLIFF, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_BROWN));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_BROWN));		
	}
}