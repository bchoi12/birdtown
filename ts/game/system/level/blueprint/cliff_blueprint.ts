
import { game } from 'game'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { LevelType, LevelLayout } from 'game/system/api'
import { Blueprint, BlueprintBlock, BlueprintOptions } from 'game/system/level/blueprint'

import { Vec, Vec2 } from 'util/vector'

class CliffBlueprintBlock extends BlueprintBlock {

	constructor(type : EntityType, options : EntityOptions) {
		super(type, options);
	}

	override dim() : Vec { return EntityFactory.getDimension(EntityType.CLIFF); }
}

export class CliffBlueprint extends Blueprint<CliffBlueprintBlock> {
	
	private _blocks : Array<CliffBlueprintBlock>;

	constructor(options : BlueprintOptions) {
		super(options);

		this._blocks = new Array();
	}

	override load() : void {
		const options = this.options();

		switch (this.getType()) {
		case LevelType.CLIFF_LAKE:
			this.loadBirdCliff(options);
			break;
		default:
			console.error("Error: level type %s not supported in CliffBlueprint", LevelType[this.getType()]);
		}
	}
	override blocks() : Array<CliffBlueprintBlock> { return this._blocks; }

	override minBuffer() : number { return -8; }
	override sideBuffer() : number { return this.getLayout() === LevelLayout.CIRCLE ? 0 : -1; }

	private loadBirdCliff(options : BlueprintOptions) : void {

		const layout = this.getLayout();

		let length;
		switch (layout) {
		case LevelLayout.CIRCLE:
			length = 6;
			break;
		case LevelLayout.TINY:
			length = 2;
			break;
		default:
			length = 4;
		}

		const seeds = new Array();
		for (let i = 0; i < length; ++i) {
			if (layout === LevelLayout.MIRROR && i >= length / 2) {
				seeds[i] = -seeds[length - i - 1];
			} else {
				seeds[i] = Math.ceil(1000 * Math.random());
			}
		}

		const dim = EntityFactory.getDimension(EntityType.CLIFF);
		const miniDim = EntityFactory.getDimension(EntityType.MINI_CLIFF);

		let pos = Vec2.fromVec(this.options().pos);
		for (let i = 0; i < length; ++i) {
			if (i === 0 && layout !== LevelLayout.CIRCLE) {
				pos.add({ x: dim.x / 2 });
				this.addBlock(EntityType.BOTTOM_CLIFF_WALL, {
					profileInit: {
						pos: pos.clone(),
					}
				});
				let leftBlock = this.addBlock(EntityType.TOP_CLIFF_WALL, {
					profileInit: {
						pos: pos.clone().add({ y: dim.y }),
					}
				});
				leftBlock.pushEntityOptions(EntityType.HIKING_SIGN, {
					profileInit: {
						pos: Vec2.fromVec(leftBlock.pos()).add({ y: dim.y / 2 + EntityFactory.getDimension(EntityType.SIGN).y / 2 }),
						dim: EntityFactory.getDimension(EntityType.SIGN),
					}
				});
				if (game.controller().useTeamSpawns()) {
					leftBlock.pushEntityOptions(EntityType.SPAWN_POINT, {
						associationInit: {
							team: 1,
						},
						profileInit: {
							pos: Vec2.fromVec(leftBlock.pos()).add({ y: dim.y / 2 + 3 }),
						},
					})
				}
				pos.add({ x: dim.x / 2});
			}

			if (i === Math.ceil(length / 2)) {
				pos.add({ x: miniDim.x / 2});
				this.addBlock(EntityType.BOTTOM_MINI_CLIFF, {
					profileInit: {
						pos: pos.clone(),
					},
					seed: seeds[i],
				});
				this.addBlock(EntityType.TOP_MINI_CLIFF, {
					profileInit: {
						pos: pos.clone().add({ y: miniDim.y }),
					},
					seed: seeds[i],
				})
				pos.add({ x: miniDim.x / 2});
			}

			pos.add({ x: dim.x / 2 });
			this.addBlock(EntityType.BOTTOM_CLIFF, {
				profileInit: {
					pos: pos.clone(),
				},
				seed: seeds[i],
			});
			this.addBlock(EntityType.TOP_CLIFF, {
				profileInit: {
					pos: pos.clone().add({ y: dim.y }),
				},
				seed: seeds[i],
			})
			pos.add({ x: dim.x / 2 });

			if (i === length - 1 && layout !== LevelLayout.CIRCLE) {
				pos.add({ x: dim.x / 2 });
				this.addBlock(EntityType.BOTTOM_CLIFF_WALL, {
					profileInit: {
						pos: pos.clone(),
					}
				});
				let rightBlock = this.addBlock(EntityType.TOP_CLIFF_WALL, {
					profileInit: {
						pos: pos.clone().add({ y: dim.y }),
					}
				})
				rightBlock.pushEntityOptions(EntityType.HIKING_SIGN, {
					profileInit: {
						pos: Vec2.fromVec(rightBlock.pos()).add({ y: dim.y / 2 + EntityFactory.getDimension(EntityType.SIGN).y / 2 }),
						dim: EntityFactory.getDimension(EntityType.SIGN),
					}
				});
				if (game.controller().useTeamSpawns()) {
					;rightBlock.pushEntityOptions(EntityType.SPAWN_POINT, {
						associationInit: {
							team: 2,
						},
						profileInit: {
							pos: Vec2.fromVec(rightBlock.pos()).add({ y: dim.y / 2 + 3 }),
						},
					})
				}
				pos.add({ x: dim.x / 2});
			}
		}

		const waterPos = {
			x: (pos.x - this.options().pos.x) / 2,
			y: this.options().pos.y + 0.4,
		}
		const waterDim = {
			x: pos.x - this.options().pos.x,
			y: dim.y,
			z: 200,
		}
		this.addBlock(EntityType.WATER, {
			profileInit: {
				pos: waterPos,
				dim: waterDim,
			}
		});
	}

	private addBlock(type : EntityType, options : EntityOptions) : CliffBlueprintBlock {
		let block = new CliffBlueprintBlock(type, options);

		this._blocks.push(block);
		return block;
	}
}