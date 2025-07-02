
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { LevelType } from 'game/system/api'
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

		switch (options.msg.getLevelType()) {
		case LevelType.BIRD_CLIFFS:
			this.loadBirdCliff(options);
			break;
		default:
			console.error("Error: level type %s not supported in CliffBlueprint", LevelType[options.msg.getLevelType()]);
		}
	}
	override blocks() : Array<CliffBlueprintBlock> { return this._blocks; }

	override minBuffer() : number { return -8; }

	private loadBirdCliff(options : BlueprintOptions) : void {

		const length = 6;
		const dim = EntityFactory.getDimension(EntityType.CLIFF);
		const miniDim = EntityFactory.getDimension(EntityType.MINI_CLIFF);

		let pos = Vec2.fromVec(this.options().pos);
		for (let i = 0; i < length; ++i) {
			if (i === Math.ceil(length / 2)) {
				pos.add({ x: miniDim.x / 2});
				this.addBlock(EntityType.BOTTOM_MINI_CLIFF, {
					profileInit: {
						pos: pos.clone(),
					}
				});
				this.addBlock(EntityType.TOP_MINI_CLIFF, {
					profileInit: {
						pos: pos.clone().add({ y: miniDim.y }),
					}
				})
				pos.add({ x: miniDim.x / 2});
			}

			pos.add({ x: dim.x / 2 });
			this.addBlock(EntityType.BOTTOM_CLIFF, {
				profileInit: {
					pos: pos.clone(),
				}
			});
			this.addBlock(EntityType.TOP_CLIFF, {
				profileInit: {
					pos: pos.clone().add({ y: dim.y }),
				}
			})
			pos.add({ x: dim.x / 2 });
		}

		const waterPos = {
			x: (pos.x - this.options().pos.x) / 2,
			y: this.options().pos.y + 0.2,
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