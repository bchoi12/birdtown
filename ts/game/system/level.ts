
import { game } from 'game'	
import { StepData } from 'game/game_object'
import { CardinalFactory } from 'game/factory/cardinal_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { GameData } from 'game/game_data'
import { System, SystemBase } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

import { Box2 } from 'util/box'
import { Buffer } from 'util/buffer'
import { CardinalDir } from 'util/cardinal'
import { defined, isLocalhost } from 'util/common'
import { HexColor } from 'util/hex_color'
import { SeededRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

type LevelOptions = {
	level : LevelType;
	seed : number;
	version? : number;
}

export class Level extends SystemBase implements System {

	private _options : LevelOptions;
	private _version : number;
	private _rng : SeededRandom;
	private _bounds : Box2;

	constructor() {
		super(SystemType.LEVEL);

		this.addNameParams({
			base: "level",
		});

		this._options = {
			level: LevelType.UNKNOWN,
			seed: 0,
		};
		this._version = 0;
		this._rng = new SeededRandom(0);
		this._bounds = Box2.zero();

		this.addProp<LevelOptions>({
			export: () => { return this._options; },
			import: (obj : LevelOptions) => { this.loadLevel(obj); },
		});
		this.addProp<Object>({
			export: () => { return this._bounds.toObject(); },
			import: (obj : Object) => { this._bounds.copyObject(obj); },
		})
	}

	override ready() : boolean { return super.ready() && this._options.level !== LevelType.UNKNOWN && this._options.seed > 0 && this._version > 0; }

	bounds() : Box2 { return this._bounds; }
	version() : number { return this._version; }

	loadLevel(options : LevelOptions) : void {
		if (options.level === LevelType.UNKNOWN) {
			console.error("Error: skipping invalid level options", options);
			return;
		}

		this._options = options;

		if (!defined(options.version)) {
			this._version++;
			this._options.version = this._version;
		} else {
			this._version = options.version;
		}
		this._rng.seed(this._options.seed);

		// Delete versioned entities which are associated with a level.
		if (this.isSource()) {
			game.entities().findEntities((entity : Entity) => {
				return entity.hasLevelVersion() && entity.levelVersion() < this._version;
			}).forEach((entity : Entity) => {
				console.log(entity);
				entity.delete();
			});

			if (isLocalhost()) {
				console.log("Unloaded level: deleted all entities below current version", this._version);
			}
		}

		this._rng.reset();
		switch (this._options.level) {
		case LevelType.LOBBY:
			this.loadLobby();
			break;
		case LevelType.BIRDTOWN:
			this.loadBirdtown();
			break;
		}

		let msg = new GameMessage(GameMessageType.LEVEL_LOAD);
		msg.setProp(GameProp.TYPE, this._options.level);
		msg.setProp(GameProp.SEED, this._rng.getSeed());
		msg.setProp(GameProp.VERSION, this._version);
    	game.runner().handleMessage(msg);

    	// TODO: send announcement in Controller
    	const uiMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
    	uiMsg.setProp(UiProp.TYPE, AnnouncementType.TEST);
    	ui.handleMessage(uiMsg);

		if (isLocalhost()) {
			console.log("Loaded level with options", this._options);
		}
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

			if (i == 0 || i == numBuildings - 1) {
				this.addEntity(EntityType.SPAWN_POINT, {
					profileInit: {
						pos: pos.clone().add({y: 2}),
					},
				});
			}

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
			this._bounds.stretch(pos);
		}
	}

	private addEntity(type : EntityType, entityOptions : EntityOptions) : [Entity, boolean] {
		entityOptions.levelVersion = this._version;
		return game.entities().addEntity(type, entityOptions);
	}
}
		