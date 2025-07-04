
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Cliff, MiniCliff } from 'game/entity/block/cliff'
import { ColorCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'

import { CardinalDir } from 'util/cardinal'
import { Fns } from 'util/fns'
import { Vec } from 'util/vector'

export class TopCliff extends Cliff {

	private static readonly _floorDepth = 15;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TOP_CLIFF, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_BROWN));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_BROWN));		
	}

	override initialize() : void {
		super.initialize();

		const rand = Math.random();

		if (rand < 0.25) {
			this.addPlatform({ x: 3, y: 0 }, 3);

			if (Math.random() < 0.5) {
				this.addFloor({x: 0, y: 0 }, 3);
				this.addFloor({x: 6, y: 0}, 9);
			} else {
				this.addCompleteFloor();
			}

			if (Math.random() < 0.5) {
				this.addTopRightPlatform();
			}

		} else if (rand < 0.5) {
			this.addPlatform({ x: 9, y: 0 }, 3);

			if (Math.random() < 0.5) {
				this.addFloor({x: 0, y: 0 }, 9);
				this.addFloor({x: 12, y: 0}, 3);
			} else {
				this.addCompleteFloor();
			}

			if (Math.random() < 0.5) {
				this.addTopLeftPlatform();
			}
		} else if (rand < 0.8) {
			this.addPlatform({ x: 6.75, y: 0}, 1.5);

			if (Math.random() < 0.75) {
				this.addFloor({x: 0, y: 0}, 6);
				this.addFloor({x: 9, y: 0}, 6);
			} else {
				this.addCompleteFloor();
			}

			if (Math.random() < 0.5) {
				this.addTopLeftPlatform();
			}
			if (Math.random() < 0.5) {
				this.addTopRightPlatform();
			}
		} else {
			this.addFloor({x: 0, y: 0}, 5);
			this.addFloor({x: 10, y: 0}, 5);

			this.addTopLeftPlatform();
			this.addTopRightPlatform();
		}

		const dim = this._profile.dim();
		const treeDim = EntityFactory.getDimension(EntityType.TREE);
		const trees = 3;
		const zOffset = -3;
		for (let i = 0; i < trees; ++i) {
			let treePos = {
				x: Math.random() * dim.x,
				y: dim.y,
				z: zOffset - i * 3,
			}

			const scale = 0.7 + 0.6 * Math.random();
			treePos.y -= (1 - scale) * treeDim.y / 2;

			this.addTrackedEntity(EntityType.TREE, {
				profileInit: {
					...this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, treeDim, treePos),
					scaling: { x: scale, y: scale },
				}
			});
		}
	}

	protected addPlatform(pos : Vec, length : number) : void {
		const profileInit = this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: length, y: this.thickness(), z: 5 }, {x: pos.x, y: 3 + pos.y });
		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				materialType: MaterialType.CLIFF_LIGHT_BROWN,
			},
		});
	}

	private addTopLeftPlatform() : void {
		this.addPlatform({ x: 3, y: 2}, 1.5);
	}
	private addTopRightPlatform() : void {
		this.addPlatform({ x: 10.5, y: 2}, 1.5);
	}

	protected addCompleteFloor() : void {
		this.addFloor({x: 0, y: 0}, this._profile.dim().x);
	}

	protected addFloor(pos : Vec, length : number) : void {
		const profileInit =
			this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: length, y: this.thickness(), z: TopCliff._floorDepth }, {x: pos.x, y: pos.y });
		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				transforms: {
					translate: { z: TopCliff._floorDepth / 4 },
				},
				materialType: MaterialType.CLIFF_BROWN,
			},
		});

		const treeDim = EntityFactory.getDimension(EntityType.TREE);

		if (length < treeDim.x) {
			return;
		}

		const maxTrees = Math.ceil(0.5 * length / treeDim.x);
		const trees = Math.ceil(Math.random() * maxTrees);
		const zOffset = 4 + (maxTrees - trees) * 3 * Math.random();
		for (let i = 0; i < trees; ++i) {
			let treePos = {
				x: Fns.clamp(pos.x + treeDim.x / 2, pos.x + Math.random() * length, pos.x + length - treeDim.x / 2),
				y: this.thickness(),
				z: zOffset + i * 3,
			}

			const scale = 1 + 0.2 * Math.random();
			treePos.y -= (1 - scale) * treeDim.y / 2;

			this.addTrackedEntity(EntityType.TREE, {
				profileInit: {
					...this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, treeDim, treePos),
					scaling: { x: scale, y: scale },
				}
			});
		}
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