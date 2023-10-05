
import { game } from 'game'	
import { AssociationType } from 'game/component/api'
import { Player } from 'game/entity/player'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { CardinalFactory } from 'game/factory/cardinal_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { System, SystemBase } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { Box, Box2 } from 'util/box'
import { Buffer } from 'util/buffer'
import { CardinalDir } from 'util/cardinal'
import { defined, isLocalhost } from 'util/common'
import { HexColor } from 'util/hex_color'
import { SeededRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

export class Level extends SystemBase implements System {

	private _levelMsg : GameMessage;

	private _rng : SeededRandom;
	private _bounds : Box2;
	private _defaultSpawn : Vec2;

	constructor() {
		super(SystemType.LEVEL);

		this.addNameParams({
			base: "level",
		});

		this._levelMsg = new GameMessage(GameMessageType.LEVEL_LOAD);
		this._rng = new SeededRandom(0);
		this._bounds = Box2.zero();
		this._defaultSpawn = Vec2.zero();

		this.addProp<Object>({
			has: () => { return this._levelMsg.updated(); },
			export: () => { return this._levelMsg.exportObject(); },
			import: (obj : MessageObject) => {
				this._levelMsg.parseObject(obj);
				this.applyLevel();
			},
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<Box>({
			export: () => { return this._bounds.toBox(); },
			import: (obj : Box) => { this._bounds.copyBox(obj); },
		});
		this.addProp<Vec>({
			export: () => { return this._defaultSpawn.toVec(); },
			import: (obj : Object) => { this._defaultSpawn.copyVec(obj); },
		});
	}

	levelType() : LevelType { return this._levelMsg.getOr<LevelType>(GameProp.TYPE, LevelType.UNKNOWN); }
	seed() : LevelType { return this._levelMsg.getOr<number>(GameProp.SEED, 0); }
	version() : number { return this._levelMsg.getOr<number>(GameProp.VERSION, 0); }
	bounds() : Box2 { return this._bounds; }

	defaultSpawn() : Vec2 { return this._defaultSpawn; }
	spawnPlayer(player : Player) : void {
		player.respawn(this._defaultSpawn);
	}

	loadLevel(msg : GameMessage) : void {
		if (msg.type() !== GameMessageType.LEVEL_LOAD) {
			console.error("Error: specified %s message for level load", GameMessageType[msg.type()]);
			return;
		}

		if (!msg.valid()) {
			console.error("Error: invalid level load message", msg);
			return;
		}

		this._levelMsg.merge(msg);
		this.applyLevel();
	}

	private applyLevel() : void {
		const level = this.levelType();
		const seed = this.seed();
		const version = this.version();

		this._rng.seed(seed);

		// Delete versioned entities which are associated with a level.
		if (this.isSource()) {
			game.entities().findEntities((entity : Entity) => {
				return entity.hasLevelVersion() && entity.levelVersion() < version;
			}).forEach((entity : Entity) => {
				entity.delete();
			});

			if (isLocalhost()) {
				console.log("Unloaded level: deleted all entities below current version", version);
			}
		}

		this._rng.reset();
		switch (level) {
		case LevelType.LOBBY:
			this.loadLobby();
			break;
		case LevelType.BIRDTOWN:
			this.loadBirdtown();
			break;
		}

		this._levelMsg.set<string>(GameProp.DISPLAY_NAME, this.displayName());
    	game.runner().handleMessage(this._levelMsg);
		if (isLocalhost()) {
			console.log("Loaded level %s with seed %d, version %d", LevelType[level], seed, version);
		}
	}

	private displayName() : string {
		switch (this.levelType()) {
		case LevelType.LOBBY:
			return "Birdtown Lobby";
		case LevelType.BIRDTOWN:
			return "Birdtown #" + this.seed();
		}
		return "Unknown Level";
	}

	private loadLobby() : void {
		let pos = new Vec2({ x: -2 * EntityFactory.getDimension(EntityType.ARCH_ROOM).x, y: -6 });
		this._bounds.collapse(pos);

		let crateSizes = Buffer.from<Vec>({x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2 });
		ColorFactory.shuffleColors(EntityType.ARCH_BASE, this._rng);
		for (let i = 0; i < 5; ++i) {
			let colors = ColorFactory.generateColorMap(EntityType.ARCH_BASE, i);
			let floors = (i % 4) === 0 ? 2 : 1;

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
			pos.y = -6;

			this._bounds.stretch(pos);
			for (let j = 0; j < floors; ++j) {
				pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
				this.addEntity(EntityType.ARCH_ROOM, {
					profileInit: {
						pos: pos,
					},
					cardinalsInit: {
						cardinals: j == 0 ? CardinalFactory.noOpenings : CardinalFactory.openSides,
					},
					hexColorsInit: {
						colors: colors,
					},
				});

				pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
			}

			pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOF).y / 2;
			this.addEntity(EntityType.ARCH_ROOF, {
				profileInit: {
					pos: pos,
				},
				cardinalsInit: {
					cardinals: (i % 4) === 0 ? CardinalFactory.noOpenings : CardinalFactory.openSides,
				},
				hexColorsInit: {
					colors: colors,
				},
			});
			pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOF).y / 2;

			if (i === 2) {
				this.addEntity(EntityType.CONSOLE, {
					profileInit: {
						pos: pos.clone().add({ y: 1}),
						dim: {x: 3, y: 1.5},
					},
				})
			}


			pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
			let chance = (i % 2) === 0 ? 0 : 1
			while (this._rng.next() < chance) {
				this.addEntity(EntityType.CRATE, {
					profileInit: {
						pos: pos.clone().addRandomOffset({x: 4, y: 2}, this._rng),
						dim: crateSizes.getRandom(this._rng),
						angle: this._rng.next() * 360,
					},
				});
				chance -= 0.15;
			}

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;

			this._bounds.stretch(pos);
		}

		this._defaultSpawn.copyVec(this._bounds.relativePos(CardinalDir.TOP));
		this.addEntity(EntityType.SPAWN_POINT, {
			profileInit: {
				pos: this._defaultSpawn,
			},
		});
	}

	private loadBirdtown() : void {
		let crateSizes = Buffer.from<Vec>({x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2 });
		let pos = new Vec2({ x: -6, y: -6 });
		this._bounds.collapse(pos);

		ColorFactory.shuffleColors(EntityType.ARCH_BASE, this._rng);
		const numBuildings = 6 + Math.floor(3 * this._rng.next());

		let heights = new Array<number>();
		for (let i = 0; i < Math.ceil(numBuildings / 2); ++i) {
			heights.push(1 + Math.floor(3 * this._rng.next()));
		}
		// Mirror the map
		for (let i = Math.floor(numBuildings / 2) - 1; i >= 0; --i) {
			heights.push(heights[i]);
		}

		for (let i = 0; i < numBuildings; ++i) {
			let colors = ColorFactory.generateColorMap(EntityType.ARCH_BASE, i);

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
			pos.y = -6;
			this._bounds.stretch(pos);
			for (let j = 0; j < heights[i]; ++j) {
				pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
				this.addEntity(EntityType.ARCH_ROOM, {
					profileInit: {
						pos: pos,
					},
					cardinalsInit: {
						cardinals: CardinalFactory.openSides,
					},
					hexColorsInit: {
						colors: colors,
					},
				});

				let chance = 0.9;
				while (this._rng.next() < chance) {
					this.addEntity(EntityType.CRATE, {
						profileInit: {
							pos: pos.clone().addRandomOffset({x: 3, y: 2}, this._rng),
							dim: crateSizes.getRandom(this._rng),
							angle: this._rng.next() * 360,
						},
					});
					chance -= 0.15;
				}

				pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
			}

			pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOF).y / 2;

			let openings = new Array<CardinalDir>();
			if (i > 0 && heights[i] < heights[i-1]) {
				openings.push(CardinalDir.LEFT);
			}
			if (i < heights.length - 1 && heights[i] < heights[i+1]) {
				openings.push(CardinalDir.RIGHT);
			}
			this.addEntity(EntityType.ARCH_ROOF, {
				profileInit: {
					pos: pos,
				},
				cardinalsInit: {
					cardinals: CardinalFactory.generateOpenings(openings),
				},
				hexColorsInit: {
					colors: colors,
				},
			});
			pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOF).y / 2;

			if (i === 0 || i === numBuildings - 1) {
				const spawnPos = pos.clone().add({y : 2});
				this.addEntity(EntityType.SPAWN_POINT, {
					profileInit: {
						pos: spawnPos,
					},
					associationInit: {
						associations: new Map([
							[AssociationType.TEAM, i === 0 ? 1 : 2],
						]),
					}
				});

				if (i === 0) {
					this._defaultSpawn = spawnPos;
				}
			}

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
			this._bounds.stretch(pos);
		}
	}

	private addEntity(type : EntityType, entityOptions : EntityOptions) : [Entity, boolean] {
		entityOptions.levelVersion = this.version();
		return game.entities().addEntity(type, entityOptions);
	}
}
		