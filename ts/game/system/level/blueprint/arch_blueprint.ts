
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { CardinalFactory, CardinalMap } from 'game/factory/cardinal_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { LevelType } from 'game/system/api'
import { Blueprint, BlueprintBlock, BlueprintOptions } from 'game/system/level/blueprint'

import { TooltipType } from 'ui/api'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { SeededRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

type BuildingPlan = {
	height : number;
	offset? : Vec;
}

class ArchBlueprintBlock extends BlueprintBlock {

	constructor(type : EntityType, options : EntityOptions) {
		super(type, options);
	}

	override dim() : Vec { return ArchBlueprint.baseDim(); }

	addBalcony(dir : CardinalDir, options : EntityOptions) : void {
		let pos = Vec2.fromVec(this.pos());
		if (dir === CardinalDir.RIGHT) {
			pos.add({
				x: ArchBlueprint.baseDim().x / 2 + ArchBlueprint.balconyDim().x / 2,
				y: -ArchBlueprint.baseDim().y / 2 + ArchBlueprint.balconyDim().y / 2,
			});
		} else {
			pos.add({
				x: -ArchBlueprint.baseDim().x / 2 - ArchBlueprint.balconyDim().x / 2,
				y: -ArchBlueprint.baseDim().y / 2 + ArchBlueprint.balconyDim().y / 2,
			});
		}

		this.addEntity(ArchBlueprint.balconyType(), {
			profileInit: {
				pos: pos,
			},
			cardinalsInit: {
				cardinals: [CardinalFactory.openings([Cardinal.opposite(dir)])],
			},
			...options,
		});
	}

	addCrates(rng : SeededRandom) : void {
		while(rng.testChance()) {
			this.addEntity(EntityType.CRATE, {
				profileInit: {
					pos: Vec2.fromVec(this.pos()).addRandomOffset({x: ArchBlueprint.baseDim().x / 3 }, rng),
					dim: { x: 1, y: 1 },
					angle: rng.next() * 360,
				},
			});
		}
	}
}

class Building {

	private _initPos : Vec2;
	private _pos : Vec2;
	private _blocks : Array<ArchBlueprintBlock>;

	constructor(pos : Vec) {
		this._initPos = Vec2.fromVec(pos);
		this._pos = this._initPos.clone();
		this._blocks = new Array();
	}

	numBlocks() : number { return this._blocks.length; }
	hasBlock(i : number) : boolean { return i >= 0 && i < this._blocks.length; }
	block(i : number) : ArchBlueprintBlock { return this._blocks[i]; }
	blocks() : Array<ArchBlueprintBlock> { return this._blocks; }

	addBlock(options : EntityOptions) : ArchBlueprintBlock {
		if (this.numBlocks() === 0) {
			this._pos.y += ArchBlueprint.baseDim().y / 2;
		} else {
			this._pos.y += ArchBlueprint.baseDim().y;
		}

		let block = new ArchBlueprintBlock(ArchBlueprint.baseType(), {
			profileInit: {
				pos: this._pos.toVec(),
			},
			...options,
		});
		this._blocks.push(block);
		return block;
	}
	addRoof(options : EntityOptions) : ArchBlueprintBlock {
		let pos = this._initPos.clone();
		pos.add({y: this.numBlocks() * ArchBlueprint.baseDim().y + ArchBlueprint.roofDim().y / 2 });

		let block = new ArchBlueprintBlock(ArchBlueprint.roofType(), {
			profileInit: {
				pos: pos.toVec(),
			},
			...options,
		});
		this._blocks.push(block);
		return block;
	}
}

export class ArchBlueprint extends Blueprint {

	private _buildings : Array<Building>;
	private _pos : Vec2;

	constructor() {
		super();

		ColorFactory.shuffleColors(ArchBlueprint.blockType(), this.rng());

		this._buildings = new Array();
		this._pos = Vec2.zero();
	}

	static baseType() : EntityType { return EntityType.ARCH_ROOM; }
	static blockType() : EntityType { return EntityType.ARCH_BLOCK; }
	static roofType() : EntityType { return EntityType.ARCH_ROOF; }
	static balconyType() : EntityType { return EntityType.ARCH_BALCONY; }
	static baseDim() : Vec { return EntityFactory.getDimension(ArchBlueprint.baseType()); }
	static roofDim() : Vec { return EntityFactory.getDimension(ArchBlueprint.roofType()); }
	static balconyDim() : Vec { return EntityFactory.getDimension(ArchBlueprint.balconyType()); }

	override load(options : BlueprintOptions) : void {
		super.load(options);

		this._pos.copyVec(options.pos);

		switch (options.level.type) {
		case LevelType.LOBBY:
			this.loadLobby(options);
			break;
		case LevelType.BIRDTOWN:
			this.loadBirdtown(options);
			break;
		default:
			console.error("Error: level type %s not supported in ArchBlueprint", LevelType[options.level.type]);
		}
	}

	buildings() : Array<Building> { return this._buildings; }
	numBuildings() : number { return this._buildings.length; }
	hasBuilding(i : number) : boolean { return i >= 0 && i < this._buildings.length; }
	building(i : number) : Building { return this._buildings[i]; }

	addBuildings(plans : Array<BuildingPlan>) : void {
		for (let i = 0; i < plans.length; ++i) {
			this.addBuilding(i, plans);
		}
	}
	addBuilding(i : number, plans : Array<BuildingPlan>) : void {
		const height = plans[i].height;
		const offset = plans[i].offset ? plans[i].offset : {x: 0, y: 0};
		const prevHeight = i > 0 ? plans[i-1].height : 0;
		const nextHeight = i < plans.length - 1 ? plans[i+1].height : 0;

		if (this._buildings.length === 0) {
			this._pos.x += ArchBlueprint.baseDim().x / 2;
		} else {
			this._pos.x += ArchBlueprint.baseDim().x;
		}
		this._pos.add(offset);

		if (height === 0) {
			return;
		}

		let building = new Building(this._pos);
		const colors = ColorFactory.generateColorMap(ArchBlueprint.blockType(), this._buildings.length);
		const options = {
			hexColorsInit: {
				colors: colors,
			}
		};
		for (let j = 0; j < height; ++j) {
			let openings = CardinalFactory.openings([]);
			if (j > 0) {
				openings.merge(this.getOpenings(j <= prevHeight || prevHeight === 0, j <= nextHeight || nextHeight === 0));
			}

			let block = building.addBlock({
				cardinalsInit: {
					cardinals: [openings],		
				},
				...options});

			if (openings.anyRight() && (j > nextHeight + 1 || nextHeight === 0)) {
				block.addBalcony(CardinalDir.RIGHT, options);
			}
			if (openings.anyLeft() && (j > prevHeight + 1 || prevHeight === 0)) {
				block.addBalcony(CardinalDir.LEFT, options);
			}
		}
		building.addRoof({
			cardinalsInit: {
				cardinals: [this.getOpenings(height <= prevHeight, height <= nextHeight)],
			},
			...options});

		this._buildings.push(building);
	}

	private loadLobby(options : BlueprintOptions) : void {
		this.addBuildings([
			{ height: 2 },
			{ height: 1 },
			{ height: 1 },
			{ height: 1 },
			{ height: 2 },
			{ height: 0 },
		]);

		for (let i = 0; i < this.numBuildings(); ++i) {
			let building = this.building(i);

			for (let j = 1; j < building.numBlocks(); ++j) {
				let block = building.block(j);

				this.rng().setChance(0.9, (n : number) => { return n - 0.3; });
				block.addCrates(this.rng());

				if (i === Math.floor(this.numBuildings() / 2) && j === building.numBlocks() - 1) {
					block.addEntity(EntityType.SIGN, {
						profileInit: {
							pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.SIGN).y / 2 }),
							dim: EntityFactory.getDimension(EntityType.SIGN),
						},
						tooltipType: TooltipType.START_GAME,
					});
				}
			}
		}
	}

	private loadBirdtown(options : BlueprintOptions) : void {

	}

	private getOpenings(openLeft : boolean, openRight : boolean) : Cardinal {
		let openings = [];
		if (openLeft) {
			openings.push(CardinalDir.LEFT);
		}
		if (openRight) {
			openings.push(CardinalDir.RIGHT);
		}
		return CardinalFactory.openings(openings);
	}

}