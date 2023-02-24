import * as MATTER from 'matter-js'

import { game } from 'game'	
import { CardinalFactory } from 'game/factory/cardinal_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { Entity, EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'

import { Data } from 'network/data'

import { Buffer } from 'util/buffer'
import { defined, isLocalhost } from 'util/common'
import { ChangeTracker } from 'util/change_tracker'
import { HexColor } from 'util/hex_color'
import { SeededRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

export enum LevelType {
	UNKNOWN,
	BIRDTOWN,
	LOBBY,
}

export class Level extends SystemBase implements System {

	private _level : LevelType;
	private _rng : SeededRandom;
	private _reloadLevel : boolean;

	constructor() {
		super(SystemType.LEVEL);

		this.setName({
			base: "level",
		});

		this._level = LevelType.UNKNOWN;
		this._rng = new SeededRandom(0);
		this._reloadLevel = false;

		this.addProp({
			has: () => { return this._level > 0; },
			export: () => { return this._level; },
			import: (obj : Object) => { this.setLevel(<number>obj); },
			options: {
				filters: Data.tcp,
			},
		});
		this.addProp({
			has: () => { return this._rng.getSeed() > 0; },
			export: () => { return this._rng.getSeed(); },
			import: (obj : Object) => { this._rng.seed(<number>obj); },
			options: {
				filters: Data.tcp,
			},
		});
	}

	setLevel(level : LevelType) : void {
		if (level !== LevelType.UNKNOWN && this._level !== level) {
			this._level = level;
			this._reloadLevel = true;
		}
	}
	setSeed(seed : number) : void {
		if (seed > 0 && this._rng.getSeed() !== seed) {
			this._rng.seed(seed);
			this._reloadLevel = true;
		}
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (this._reloadLevel) {
			if (isLocalhost()) {
				console.log("Loading level %d with seed %d", this._level, this._rng.getSeed());
			}

			this._rng.reset();

			// TODO: this sucks
			game.entities().queryEntities<Entity>({
				type: EntityType.CRATE,
				mapQuery: {},
			}).forEach((entity : Entity) => {
				entity.delete();
			});
			game.entities().queryEntities<Entity>({
				type: EntityType.WALL,
				mapQuery: {},
			}).forEach((entity : Entity) => {
				entity.delete();
			});
			game.entities().queryEntities<Entity>({
				type: EntityType.ARCH_ROOM,
				mapQuery: {},
			}).forEach((entity : Entity) => {
				entity.delete();
			});
			game.entities().queryEntities<Entity>({
				type: EntityType.ARCH_ROOF,
				mapQuery: {},
			}).forEach((entity : Entity) => {
				entity.delete();
			});


			switch (this._level) {
			case LevelType.LOBBY:
				this.loadLobby();
				break;
			case LevelType.BIRDTOWN:
				this.loadBirdtown();
				break;
			}
			this._reloadLevel = false;

	    	game.runner().onLevelLoad(this._level, this._rng.getSeed());
		}
	}

	private loadLobby() : void {
		let entities = game.entities();

		let pos = new Vec2({ x: -2 * EntityFactory.getDimension(EntityType.ARCH_ROOM).x, y: -6 });
		let crateSizes = Buffer.from<Vec>({x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2 });

		ColorFactory.shuffleColors(EntityType.ARCH_BASE, this._rng);
		for (let i = 0; i < 4; ++i) {
			let colors = ColorFactory.generateColorMap(EntityType.ARCH_BASE, i);
			let floors = (i % 3) === 0 ? 2 : 1;

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
			pos.y = -6;
			for (let j = 0; j < floors; ++j) {
				pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
				entities.addEntity(EntityType.ARCH_ROOM, {
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
			entities.addEntity(EntityType.ARCH_ROOF, {
				profileInit: {
					pos: pos,
				},
				cardinalsInit: {
					cardinals: (i % 3) === 0 ? CardinalFactory.noOpenings : CardinalFactory.openSides,
				},
				hexColorsInit: {
					colors: colors,
				},
			});
			pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOF).y / 2;

			pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
			let chance = (i % 3) === 0 ? 0 : 1
			while (this._rng.next() < chance) {
				entities.addEntity(EntityType.CRATE, {
					profileInit: {
						pos: pos.clone().addRandomOffset({x: 4, y: 2}, this._rng),
						dim: crateSizes.getRandom(this._rng),
						angle: this._rng.next() * 360,
					},
				});
				chance -= 0.15;
			}

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
		}
	}

	// TODO: allow client to load the level themselves? Race conditions could be nasty
	private loadBirdtown() : void {
		let entities = game.entities();
		let crateSizes = Buffer.from<Vec>({x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2 });
		let pos = new Vec2({ x: -6, y: -3 });

		ColorFactory.shuffleColors(EntityType.ARCH_BASE, this._rng);
		for (let i = 0; i < 4; ++i) {
			let colors = ColorFactory.generateColorMap(EntityType.ARCH_BASE, i);
			let floors = 2 + Math.floor(3 * this._rng.next());

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
			pos.y = -3;
			for (let j = 0; j < floors; ++j) {
				pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
				entities.addEntity(EntityType.ARCH_ROOM, {
					profileInit: {
						pos: pos,
					},
					cardinalsInit: {
						cardinals: CardinalFactory.generateOpenings(),
					},
					hexColorsInit: {
						colors: colors,
					},
				});

				let chance = 0.9;
				while (this._rng.next() < chance) {
					entities.addEntity(EntityType.CRATE, {
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
			entities.addEntity(EntityType.ARCH_ROOF, {
				profileInit: {
					pos: pos,
				},
				cardinalsInit: {
					cardinals: CardinalFactory.generateOpenings(),
				},
				hexColorsInit: {
					colors: colors,
				},
			});
			pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOF).y / 2;
			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
		}
	}
}
		