
import { game } from 'game'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ColorCategory, ColorType, MaterialType } from 'game/factory/api'
import { CardinalFactory } from 'game/factory/cardinal_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { LevelType } from 'game/system/api'
import { Blueprint, BlueprintBlock, BlueprintOptions } from 'game/system/level/blueprint'

import { TooltipType } from 'ui/api'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { HexColor } from 'util/hex_color'
import { Fns } from 'util/fns'
import { SeededRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

type BuildingPlan = {
	height : number;
}

class ArchBlueprintBlock extends BlueprintBlock {

	constructor(type : EntityType, options : EntityOptions) {
		super(type, options);
	}

	override dim() : Vec {
		switch (this.type()) {
		case ArchBlueprint.roofType():
			return ArchBlueprint.roofDim();
		case ArchBlueprint.backgroundType():
			return {x: 0, y: 0};
		default:
			return ArchBlueprint.baseDim();
		}
	}

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

		this.pushEntityOptions(ArchBlueprint.balconyType(), {
			profileInit: {
				pos: pos,
			},
			cardinalsInit: {
				cardinals: [CardinalFactory.openings([Cardinal.opposite(dir)])],
			},
			...options,
		});
	}

	addSampleCrates(rng : SeededRandom) : void {
		if (this.type() === ArchBlueprint.backgroundType()) {
			return;
		}

		rng.setChance(1, (n : number) => { return n - 0.2; });
		while(rng.testChance()) {
			this.pushEntityOptions(rng.next() < 0.3 ? EntityType.HEALTH_CRATE : EntityType.WEAPON_CRATE, {
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
	private _height : number;
	private _blocks : Array<ArchBlueprintBlock>;

	constructor(pos : Vec, height : number) {
		this._initPos = Vec2.fromVec(pos);
		this._pos = this._initPos.clone();
		this._height = height;
		this._blocks = new Array();
	}

	initPos() : Vec2 { return this._initPos; }
	height() : number { return this._height; }
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

	addBackgroundBuilding(height : number, rng : SeededRandom, options : EntityOptions) : ArchBlueprintBlock {
		const extras = 3;

		let pos = this._initPos.clone();
		pos.add({ y: rng.next() * ArchBlueprint.baseDim().y / 2 });
		pos.sub({ y: (extras - 1.66) * ArchBlueprint.baseDim().y });
		let block = new ArchBlueprintBlock(ArchBlueprint.backgroundType(), {
			profileInit: {
				pos: pos.toVec(),
			},
			...options,
		});

		for (let i = 0; i < height + extras; ++i) {
			pos.add({y: ArchBlueprint.baseDim().y / 2 });

			block.pushEntityOptions(ArchBlueprint.backgroundType(), {
				profileInit: {
					pos: pos.toVec(),
				},
				...options,
			});
			pos.add({y: ArchBlueprint.baseDim().y / 2 });
		}


		this._blocks.push(block);
		return block;
	}
}

export class ArchBlueprint extends Blueprint {

	private static readonly _numBasementBlocks = 2;

	private _buildings : Array<Building>;
	private _pos : Vec2;
	private _maxHeight : number;

	constructor(options : BlueprintOptions) {
		super(options);

		ColorFactory.shuffleEntityColors(ArchBlueprint.blockType(), this.rng());

		this._buildings = new Array();
		this._pos = Vec2.zero();
		this._maxHeight = 0;
	}

	static baseType() : EntityType { return EntityType.ARCH_ROOM; }
	static blockType() : EntityType { return EntityType.ARCH_BLOCK; }
	static roofType() : EntityType { return EntityType.ARCH_ROOF; }
	static balconyType() : EntityType { return EntityType.ARCH_BALCONY; }
	static backgroundType() : EntityType { return EntityType.BACKGROUND_ARCH_ROOM; }
	static baseDim() : Vec { return EntityFactory.getDimension(ArchBlueprint.baseType()); }
	static roofDim() : Vec { return EntityFactory.getDimension(ArchBlueprint.roofType()); }
	static balconyDim() : Vec { return EntityFactory.getDimension(ArchBlueprint.balconyType()); }

	static generateColorMap(type : EntityType, index? : number) : Map<number, HexColor> {
		if (!index || index < 0 ) { index = 0; }

		return new Map([
			[ColorCategory.BASE, ColorFactory.entityColor(EntityType.ARCH_BLOCK, index)],
			[ColorCategory.SECONDARY, ColorFactory.color(ColorType.LEVEL_WHITE)],
		]);
	}


	override load() : void {
		const options = this.options();
		this._pos.copyVec(options.pos);

		switch (options.msg.getLevelType()) {
		case LevelType.LOBBY:
			this.loadLobby(options);
			break;
		case LevelType.BIRDTOWN:
		case LevelType.BIRDTOWN_CIRCLE:
			this.loadBirdtown(options);
			break;
		case LevelType.DUELTOWN:
			this.loadDueltown(options);
			break;
		case LevelType.TINYTOWN:
			this.loadTinytown(options);
			break;
		default:
			console.error("Error: level type %s not supported in ArchBlueprint", LevelType[options.msg.getLevelType()]);
		}
	}

	maxHeight() : number { return this._maxHeight; }

	buildings() : Array<Building> { return this._buildings; }
	numBuildings() : number { return this._buildings.length; }
	hasBuilding(i : number) : boolean { return i >= 0 && i < this._buildings.length; }
	building(i : number) : Building { return this._buildings[i]; }

	addBuildings(plans : Array<BuildingPlan>) : void {
		for (let i = 0; i < plans.length; ++i) {
			this.addBuilding(i, plans);
		}
	}
	addBuilding(i : number, plans : Array<BuildingPlan>) : Building {
		const height = plans[i].height;
		const prevHeight = i > 0 ? plans[i-1].height : 0;
		const nextHeight = i < plans.length - 1 ? plans[i+1].height : 0;

		this._maxHeight = Math.max(height, this._maxHeight);

		if (this._buildings.length === 0) {
			this._pos.x += ArchBlueprint.baseDim().x / 2;
		} else {
			this._pos.x += ArchBlueprint.baseDim().x;
		}

		let building = new Building(this._pos, height);
		if (height > 0) {
			const colors = ArchBlueprint.generateColorMap(ArchBlueprint.blockType(), this._buildings.length);
			const options = {
				hexColorsInit: {
					colors: colors,
				}
			};

			// Basement
			for (let j = 0; j < ArchBlueprint._numBasementBlocks; ++j) {
				building.addBlock({
					cardinalsInit: {
						cardinals: [CardinalFactory.openings([])],		
					},
					...options});
			}

			// height of 1 == only basement
			for (let j = 1; j < height; ++j) {
				let openings = CardinalFactory.openings([]);
				openings.merge(this.getOpenings(/*openLeft=*/true, /*openRight=*/true));

				let block = building.addBlock({
					cardinalsInit: {
						cardinals: [openings],		
					},
					...options});

				if (openings.anyRight() && (j > nextHeight || nextHeight === 0)) {
					block.addBalcony(CardinalDir.RIGHT, options);
				}
				if (openings.anyLeft() && (j > prevHeight || prevHeight === 0)) {
					block.addBalcony(CardinalDir.LEFT, options);
				}
			}		
			building.addRoof({
				cardinalsInit: {
					cardinals: [this.getOpenings(height <= prevHeight, height <= nextHeight)],
				},
				...options});
		}

		let backgroundHeight = height;
		this.rng().switch([
			[0.5, () => { backgroundHeight++; }],
			[0.6, () => { backgroundHeight+=2; }],
		]);

		const materialTypes = MaterialFactory.levelBackgroundMaterials()
		building.addBackgroundBuilding(backgroundHeight, this.rng(), {
			modelInit: {
				materialType: materialTypes[i % materialTypes.length]
			},
		});

		this._buildings.push(building);
		return building;
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

			for (let j = ArchBlueprint._numBasementBlocks; j < building.numBlocks(); ++j) {
				let block = building.block(j);

				if (block.type() === ArchBlueprint.roofType()) {
					if (i === 2) {
						block.pushEntityOptions(EntityType.START_GAME_SIGN, {
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ x: -2.7, y: EntityFactory.getDimension(EntityType.SIGN).y / 2 }),
								dim: EntityFactory.getDimension(EntityType.SIGN),
							},
						});

						if (game.controller().canRematch()) {
							block.pushEntityOptions(EntityType.REMATCH_SIGN, {
								offline: true,
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({ x: -5.4, y: EntityFactory.getDimension(EntityType.SIGN).y / 2 }),
									dim: EntityFactory.getDimension(EntityType.SIGN),
								},
							});
						}

						block.pushEntityOptions(EntityType.CONTROLS_SIGN, {
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ x: 2.7, y: EntityFactory.getDimension(EntityType.SIGN).y / 2 }),
								dim: EntityFactory.getDimension(EntityType.SIGN),
							},
						});
					} else if (i === 0) {
						block.pushEntityOptions(EntityType.BUSH, {
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({
									x: -3,
									y: EntityFactory.getDimension(EntityType.BUSH).y / 2
								}),
							}
						});
						block.pushEntityOptions(EntityType.BUSH, {
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({
									x: 3,
									y: EntityFactory.getDimension(EntityType.BUSH).y / 2
								}),
							}
						});
					} else if (building.height() === this.maxHeight()) {
						block.pushEntityOptions(EntityType.BILLBOARD, {
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.BILLBOARD).y / 2 }),
							}
						});
					}
				} else if (block.type() === ArchBlueprint.baseType()) {
					block.pushEntityOptions(EntityType.TABLE, {
						profileInit: {
							pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.TABLE).y / 2 }),
						},
					});
				}
			}
		}
	}

	private loadBirdtown(options : BlueprintOptions) : void {
		const plan = this.generateBirdtownPlan(options);
		this.addBuildings(plan);
		this.populateTown(plan, options);
	}

	private loadTinytown(options : BlueprintOptions) : void {
		const plan = this.generateTinytownPlan(options);
		this.addBuildings(plan);
		this.populateTown(plan, options);
	}

	private generateTinytownPlan(options : BlueprintOptions) : Array<BuildingPlan> {
		const length = 3 + Math.ceil(options.msg.getNumPlayers() / 4) + this.rng().int(2);

		return this.generateTownPlan(length, options);
	}

	private generateBirdtownPlan(options : BlueprintOptions) : Array<BuildingPlan> {
		let length;
		if (game.level().isCircle()) {
			// Need at least 8 to avoid pop-ins
			length = 5 + Math.max(3, Math.ceil(options.msg.getNumPlayers() / 3) + this.rng().int(2));
		} else {
			length = 5 + Math.ceil(options.msg.getNumPlayers() / 3) + this.rng().int(2);
		}

		return this.generateTownPlan(length, options);
	}

	private generateTownPlan(length : number, options : BlueprintOptions) : Array<BuildingPlan> {
		let plan = new Array<BuildingPlan>();
		let currentHeight = 2;
		const maxHeight = 3;
		for (let i = 0; i < length; ++i) {
			if (i === length - 1 && !game.level().isCircle()) {
				currentHeight = Math.max(1, currentHeight);
			}

			plan.push({
				height: currentHeight,
			});

			if (i === length - 1) {
				break;
			}

			if (currentHeight === 0) {
				currentHeight = this.rng().int(maxHeight) + 1;
			} else if (currentHeight === 1) {
				this.rng().switch([
					[0.5, () => { currentHeight = 2; }],
					[0.8, () => { currentHeight = 3; }],
				]);
			} else if (currentHeight === 2) {
				this.rng().switch([
					[0.5, () => { currentHeight--; }],
					[0.8, () => { currentHeight = 0; }],
					[0.95, () => { currentHeight++; }],
				]);
			} else {
				this.rng().switch([
					[0.6, () => { currentHeight--; }],
					[0.95, () => { currentHeight -= 2; }],
				]);
			}
			currentHeight = Fns.clamp(0, currentHeight, maxHeight);
		}

		if (currentHeight > 0 && game.level().isCircle()) {
			plan.push({
				height: 0,
			});
		}

		return plan;
	}

	private populateTown(plan : Array<BuildingPlan>, options : BlueprintOptions) {
		for (let i = 0; i < this.numBuildings(); ++i) {
			let building = this.building(i);

			for (let j = ArchBlueprint._numBasementBlocks; j < building.numBlocks(); ++j) {
				let block = building.block(j);

				if (block.type() === ArchBlueprint.roofType()) {
					const next = this.rng().next();
					const next2 = this.rng().next();

					if (game.controller().useTeamSpawns() && i === 0) {
						block.pushEntityOptions(EntityType.SPAWN_POINT, {
							associationInit: {
								team: 1,
							},
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ y: 4 }),
							},
						})
					} else if (game.controller().useTeamSpawns() && i === this.numBuildings() - 1) {
						block.pushEntityOptions(EntityType.SPAWN_POINT, {
							associationInit: {
								team: 2,
							},
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ y: 4 }),
							},
						})
					} else if (building.height() === 3) {
						if (next <= 0.7) {
							block.pushEntityOptions(EntityType.BILLBOARD, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.BILLBOARD).y / 2 }),
								}
							});
						}
					} else if (building.height() === 2) {
						if (next <= 0.2) {
							block.pushEntityOptions(EntityType.BILLBOARD, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.BILLBOARD).y / 2 }),
								}
							});
						} else if (next <= 0.6) {
							block.pushEntityOptions(EntityType.PERGOLA, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.PERGOLA).y / 2 + 1}),
								},
							});
						}

						// No bush & billboard at same time
						if (next > 0.2 && next2 <= 0.3) {
							block.pushEntityOptions(EntityType.BUSH, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({
										x: -3,
										y: EntityFactory.getDimension(EntityType.BUSH).y / 2
									}),
								}
							});
							block.pushEntityOptions(EntityType.BUSH, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({
										x: 3,
										y: EntityFactory.getDimension(EntityType.BUSH).y / 2
									}),
								}
							});
						}
					} else if (building.height() === 1) {
						if (next <= 0.4) {
							block.pushEntityOptions(EntityType.PERGOLA, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.PERGOLA).y / 2 + 1}),
								},
							});
						}
						if (next2 <= 0.4) {
							block.pushEntityOptions(EntityType.BUSH, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({
										x: -3,
										y: EntityFactory.getDimension(EntityType.BUSH).y / 2
									}),
								}
							});
							block.pushEntityOptions(EntityType.BUSH, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({
										x: 3,
										y: EntityFactory.getDimension(EntityType.BUSH).y / 2
									}),
								}
							});
						}
					}
				} else if (block.type() === ArchBlueprint.baseType()) {
					if (this.rng().le(0.5)) {
						block.pushEntityOptions(EntityType.TABLE, {
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.TABLE).y / 2 }),
							},
						});
					}
				}
			}
		}
	}

	private loadDueltown(options : BlueprintOptions) : void {
		const plan = this.generateDueltownPlan(options);
		this.addBuildings(plan);

		let pergolaMod = this.rng().int(2);
		let tableMod = this.rng().int(2);
		let bushMod = this.rng().int(3);

		const numBuildings = this.numBuildings();
		for (let i = 0; i < numBuildings; ++i) {
			let building = this.building(i);

			for (let j = ArchBlueprint._numBasementBlocks; j < building.numBlocks(); ++j) {
				let block = building.block(j);

				if (block.type() === ArchBlueprint.roofType()) {
					if (game.controller().useTeamSpawns() && i === 1) {
						block.pushEntityOptions(EntityType.SPAWN_POINT, {
							associationInit: {
								team: 1,
							},
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ y: 4 }),
							},
						})
					} else if (game.controller().useTeamSpawns() && i === this.numBuildings() - 2) {
						block.pushEntityOptions(EntityType.SPAWN_POINT, {
							associationInit: {
								team: 2,
							},
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ y: 4 }),
							},
						})
					} else if (building.height() === 3) {
						block.pushEntityOptions(EntityType.BILLBOARD, {
							profileInit: {
								pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.BILLBOARD).y / 2 }),
							}
						});
					} else {
						if (building.height() % 2 === pergolaMod) {
							block.pushEntityOptions(EntityType.PERGOLA, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.PERGOLA).y / 2 + 1}),
								},
							});
						}
						if (building.height() % 3 === bushMod) {
							block.pushEntityOptions(EntityType.BUSH, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({
										x: -3,
										y: EntityFactory.getDimension(EntityType.BUSH).y / 2
									}),
								}
							});
							block.pushEntityOptions(EntityType.BUSH, {
								profileInit: {
									pos: Vec2.fromVec(block.pos()).add({
										x: 3,
										y: EntityFactory.getDimension(EntityType.BUSH).y / 2
									}),
								}
							});
						}
					}
				} else if (block.type() === ArchBlueprint.baseType()
					&& (i < numBuildings / 2 && i % 2 === tableMod)
						|| (i >= numBuildings / 2 && (numBuildings - i - 1) % 2 === tableMod)) {
					block.pushEntityOptions(EntityType.TABLE, {
						profileInit: {
							pos: Vec2.fromVec(block.pos()).add({ y: EntityFactory.getDimension(EntityType.TABLE).y / 2 }),
						},
					});
				}
			}
		}
	}

	private generateDueltownPlan(options : BlueprintOptions) : Array<BuildingPlan> {
		let plan = new Array<BuildingPlan>();
		plan.push({
			height: 0,
		});

		const length = 5 + this.rng().int(3);

		let currentHeight = 1;
		const maxHeight = 3;
		let buildings = new Array<BuildingPlan>();
		buildings.push({
			height: currentHeight,
		});

		for (let i = 1; i < length; ++i) {
			if (i >= length / 2) {
				buildings.push({
					height: buildings[length - i - 1].height,
				});
				continue;
			} else if (length % 2 === 1 && i === Math.floor(length / 2)) {
				currentHeight = currentHeight === maxHeight ? 0 : maxHeight;
				buildings.push({
					height: currentHeight,
				});
				continue;
			}

			if (i === 1) {
				this.rng().switch([
					[0.3, () => { currentHeight = 1; }],
					[0.6, () => { currentHeight = 2; }],
					[1, () => { currentHeight = 3; }],
				]);
			} else if (length % 2 === 0 && i === length / 2 - 1) {
				// Disallow large gap in middle
				if (currentHeight > 1) {
					currentHeight = 1;
				} else {
					currentHeight = 3;
				}
			} else if (currentHeight === 0) {
				this.rng().switch([
					[0.4, () => { currentHeight = 1; }],
					[0.8, () => { currentHeight = 2; }],
					[1, () => { currentHeight = 3; }],
				]);
			} else if (currentHeight === 1) {
				this.rng().switch([
					[0.4, () => { currentHeight = 0; }],
					[0.6, () => { currentHeight = 2; }],
					[1, () => { currentHeight = 3; }],
				]);
			} else if (currentHeight === 2) {
				this.rng().switch([
					[0.4, () => { currentHeight = 0; }],
					[0.8, () => { currentHeight = 1; }],
					[1, () => { currentHeight = 3; }],
				]);
			} else {
				this.rng().switch([
					[0.2, () => { currentHeight = 0; }],
					[0.8, () => { currentHeight = 1; }],
					[1, () => { currentHeight = 2; }],
				]);
			}
			currentHeight = Fns.clamp(0, currentHeight, maxHeight);

			buildings.push({
				height: currentHeight,
			});
		}

		plan.push(...buildings);
		plan.push({
			height: 0,
		});

		return plan;
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