
import { ProfileInitOptions } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Cliff, CliffBase, MiniCliff, CliffWall } from 'game/entity/block/cliff'
import { Platform } from 'game/entity/bound/platform'
import { ColorCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'

import { CardinalDir } from 'util/cardinal'
import { Fns } from 'util/fns'
import { Vec } from 'util/vector'

export class TopCliff extends Cliff {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TOP_CLIFF, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_BROWN));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_BROWN));		
	}

	override initialize() : void {
		super.initialize();

		const rand = this._rng.next();

		if (rand < 0.25) {
			this.addLeftPlatform(this._mirrored);
		} else if (rand < 0.5) {
			this.addRightPlatform(this._mirrored);
		} else if (rand < 0.8) {
			this.addPlatform({ x: 6.75, y: 0}, 1.5);

			if (this._rng.next() < 0.75) {
				this.addFloor({x: 0, y: 0}, 6);
				this.addFloor({x: 9, y: 0}, 6);
			} else {
				this.addCompleteFloor();
			}

			if (this._rng.next() < 0.5) {
				this.addTopLeftPlatform(this._mirrored);
			}
			if (this._rng.next() < 0.5) {
				this.addTopRightPlatform(this._mirrored);
			}
		} else {
			this.addFloor({x: 0, y: 0}, 5);
			this.addFloor({x: 10, y: 0}, 5);

			this.addTopLeftPlatform(this._mirrored);
			this.addTopRightPlatform(this._mirrored);
		}

		const dim = this._profile.dim();
		const treeDim = EntityFactory.getDimension(EntityType.TREE);
		const trees = 3;
		const zOffset = -3;
		for (let i = 0; i < trees; ++i) {

			const xMax = dim.x - treeDim.x;
			let treePos = {
				x: this._rng.next() * xMax,
				y: dim.y,
				z: zOffset - i * 3,
			}

			if (this._mirrored) {
				treePos.x = xMax - treePos.x;
			}

			const scale = 0.7 + 0.6 * this._rng.next();
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
		this.addTrackedEntity<Platform>(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				materialType: MaterialType.CLIFF_PLATFORM,
			},
		});
	}

	private addLeftPlatform(mirrored : boolean) : void {
		if (mirrored) {
			this.addRightPlatform(false);
			return;
		}

		this.addPlatform({ x: 3, y: 0 }, 3);

		if (this._rng.next() < 0.5) {
			this.addFloor({x: 0, y: 0 }, 3);
			this.addFloor({x: 6, y: 0}, 9);
		} else {
			this.addCompleteFloor();
		}

		if (this._rng.next() < 0.5) {
			this.addTopRightPlatform(false);
		}
	}
	private addRightPlatform(mirrored : boolean) : void {
		if (mirrored) {
			this.addLeftPlatform(false);
			return;
		}

		this.addPlatform({ x: 9, y: 0 }, 3);

		if (this._rng.next() < 0.5) {
			this.addFloor({x: 0, y: 0 }, 9);
			this.addFloor({x: 12, y: 0}, 3);
		} else {
			this.addCompleteFloor();
		}

		if (this._rng.next() < 0.5) {
			this.addTopLeftPlatform(false);
		}
	}

	private addTopLeftPlatform(mirrored : boolean) : void {
		if (mirrored) {
			this.addTopRightPlatform(false);
			return;
		}

		this.addPlatform({ x: 3, y: 2}, 1.5);
	}
	private addTopRightPlatform(mirrored : boolean) : void {
		if (mirrored) {
			this.addTopLeftPlatform(false);
			return;
		}
		this.addPlatform({ x: 10.5, y: 2}, 1.5);
	}

	protected addCompleteFloor() : void {
		this.addFloor({x: 0, y: 0}, this._profile.dim().x);
	}

	protected addFloor(pos : Vec, length : number) : void {
		const profileInit =
			this._profile.createRelativeInit(CardinalDir.BOTTOM_LEFT, {x: length, y: this.thickness(), z: CliffBase._floorDepth }, {x: pos.x, y: pos.y });
		this.addTrackedEntity(EntityType.PLATFORM, {
			profileInit: profileInit,
			modelInit: {
				transforms: {
					translate: { z: CliffBase._floorDepth / 4 },
				},
				materialType: MaterialType.CLIFF_BROWN,
			},
		});

		const treeDim = EntityFactory.getDimension(EntityType.TREE);
		if (length < treeDim.x) {
			return;
		}

		const dim = this._profile.dim();
		const maxTrees = Math.ceil(0.7 * length / treeDim.x);
		const trees = Math.round(this._rng.next() * maxTrees);
		const zOffset = 4 + (maxTrees - trees) * 3 * this._rng.next();
		for (let i = 0; i < trees; ++i) {
			const xMax = length - treeDim.x;
			let treePos = {
				x: Fns.clamp(0, this._rng.next() * length, xMax),
				y: this.thickness(),
				z: zOffset + i * 3,
			}

			if (this._mirrored) {
				treePos.x = xMax - treePos.x;
			}
			treePos.x += pos.x;

			const scale = 0.8 + 0.4 * this._rng.next();
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

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TOP_MINI_CLIFF, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_BROWN));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_BROWN));		
	}
}

export class TopCliffWall extends CliffWall {
	constructor(entityOptions : EntityOptions) {
		super(EntityType.TOP_CLIFF_WALL, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.toHex(ColorType.CLIFF_BROWN));
		this._hexColors.setColor(ColorCategory.SECONDARY, ColorFactory.toHex(ColorType.CLIFF_LIGHT_BROWN));	
	}

	override initialize() : void {
		super.initialize();

		const dim = this._profile.dim();
		const treeDim = EntityFactory.getDimension(EntityType.TREE);
		const trees = 2;
		const zOffset = -3;
		for (let i = 0; i < trees; ++i) {

			const xMax = dim.x - treeDim.x;
			let treePos = {
				// Clear middle for other objects
				x: this._rng.next() * xMax / 3 + ((i % 2 === 0) ? 0 : (2 * xMax / 3)),
				y: dim.y,
				z: zOffset - i * 3,
			}

			if (this._mirrored) {
				treePos.x = xMax - treePos.x;
			}

			const scale = 0.7 + 0.6 * this._rng.next();
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