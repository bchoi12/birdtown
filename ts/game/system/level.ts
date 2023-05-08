import { game } from 'game'	
import { CardinalFactory } from 'game/factory/cardinal_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { System, SystemBase } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'

import { GameData } from 'game/game_data'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

import { Buffer } from 'util/buffer'
import { defined, isLocalhost } from 'util/common'
import { ChangeTracker } from 'util/change_tracker'
import { HexColor } from 'util/hex_color'
import { SeededRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

enum State {
	UNKNOWN,
	READY,
	UNLOAD,
	SYNC_CLIENTS,
	LOAD,
}

export class Level extends SystemBase implements System {

	private _level : LevelType;
	private _rng : SeededRandom;
	private _version : number;

	private _state : State;

	constructor() {
		super(SystemType.LEVEL);

		this.setName({
			base: "level",
		});

		this._level = LevelType.UNKNOWN;
		this._rng = new SeededRandom(0);
		this._version = 0;
		this._state = State.READY;

		this.addProp<number>({
			has: () => { return this._level > 0; },
			export: () => { return this._level; },
			import: (obj : number) => { this.setLevel(obj); },
			options: {
				conditionalInterval: (obj : number, elapsed : number) => {
					return this._state === State.SYNC_CLIENTS && elapsed >= 1000;
				},
			},
		});
		this.addProp<number>({
			has: () => { return this._rng.getSeed() > 0; },
			export: () => { return this._rng.getSeed(); },
			import: (obj : number) => { this.setSeed(obj); },
			options: {
				conditionalInterval: (obj : number, elapsed : number) => {
					return this._state === State.SYNC_CLIENTS && elapsed >= 1000;
				},
			},
		});
		this.addProp<number>({
			has: () => { return this._version > 0; },
			export: () => { return this._version; },
			import: (obj : number) => { this._version = obj; },
			options: {
				conditionalInterval: (obj : number, elapsed : number) => {
					return this._state === State.SYNC_CLIENTS && elapsed >= 1000;
				},
			},
		})
	}

	version() : number { return this._version; }
	setVersion(version : number) : void {

	}

	setLevel(level : LevelType) : void {
		if (level !== LevelType.UNKNOWN && this._level !== level) {
			this._level = level;

			if (this._state === State.READY) {
				this._version++;
			}
			this._state = State.UNLOAD;
		}
	}
	setSeed(seed : number) : void {
		if (seed > 0 && this._rng.getSeed() !== seed) {
			this._rng.seed(seed);

			if (this._state === State.READY) {
				this._version++;
			}
			this._state = State.UNLOAD;
		}
	}
	finishLoad() : void { this._state = State.READY; }

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (this._state === State.LOAD) {
			if (isLocalhost()) {
				console.log("Loading level %d with seed %d", this._level, this._rng.getSeed());
			}

			this._rng.reset();
			switch (this._level) {
			case LevelType.LOBBY:
				this.loadLobby();
				break;
			case LevelType.BIRDTOWN:
				this.loadBirdtown();
				break;
			}

	    	game.runner().onLevelLoad({
	    		level: this._level,
	    		seed: this._rng.getSeed(),
	    		version: this._version,
	    	});

	    	ui.showAnnouncement({
	    		type: AnnouncementType.TEST,
	    	});
			this._state = State.READY;
		}
	}

	override postRender(millis : number) : void {
		super.postRender(millis);

		if (this._state === State.UNLOAD) {
			game.entities().queryEntities<Entity>({
				mapQuery: {
					filter: (entity : Entity) => {
						return !entity.initialized() || entity.hasLevelVersion() && entity.levelVersion() <= this._version;
					},
				},
			}).forEach((entity : Entity) => {
				entity.delete();
			});

			this._state = State.LOAD;
		}
	}

	private loadLobby() : void {
		let pos = new Vec2({ x: -2 * EntityFactory.getDimension(EntityType.ARCH_ROOM).x, y: -6 });
		let crateSizes = Buffer.from<Vec>({x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2 });

		ColorFactory.shuffleColors(EntityType.ARCH_BASE, this._rng);
		for (let i = 0; i < 5; ++i) {
			let colors = ColorFactory.generateColorMap(EntityType.ARCH_BASE, i);
			let floors = (i % 4) === 0 ? 2 : 1;

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
			pos.y = -6;
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
		}
	}

	private loadBirdtown() : void {
		let crateSizes = Buffer.from<Vec>({x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2 });
		let pos = new Vec2({ x: -6, y: -3 });

		ColorFactory.shuffleColors(EntityType.ARCH_BASE, this._rng);
		const numBuildings = 3 + Math.floor(3 * this._rng.next());
		for (let i = 0; i < numBuildings; ++i) {
			let colors = ColorFactory.generateColorMap(EntityType.ARCH_BASE, i);
			let floors = 1 + Math.floor(3 * this._rng.next());

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
			pos.y = -3;
			for (let j = 0; j < floors; ++j) {
				pos.y += EntityFactory.getDimension(EntityType.ARCH_ROOM).y / 2;
				this.addEntity(EntityType.ARCH_ROOM, {
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
			this.addEntity(EntityType.ARCH_ROOF, {
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

			if (i == 0 || i == numBuildings - 1) {
				this.addEntity(EntityType.SPAWN_POINT, {
					profileInit: {
						pos: pos.clone().add({y: 2}),
					},
				});
			}

			pos.x += EntityFactory.getDimension(EntityType.ARCH_ROOM).x / 2;
		}
	}

	private addEntity(type : EntityType, entityOptions : EntityOptions) : [Entity, boolean] {
		entityOptions.levelVersion = this._version;
		return game.entities().addEntity(type, entityOptions);
	}
}
		