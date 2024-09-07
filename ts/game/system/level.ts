
import { game } from 'game'	
import { GameState } from 'game/api'
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
import { SystemType, LevelType, LevelLayout } from 'game/system/api'
import { ArchBlueprint } from 'game/system/level/blueprint/arch_blueprint'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { StatusType } from 'ui/api'

import { Box, Box2 } from 'util/box'
import { Buffer } from 'util/buffer'
import { CardinalDir } from 'util/cardinal'
import { isLocalhost } from 'util/common'
import { Fns } from 'util/fns'
import { SeededRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

export type LevelOptions = {
	type : LevelType;
	layout : LevelLayout;
	seed : number;
}

export class Level extends SystemBase implements System {

	private _levelMsg : GameMessage;
	private _bounds : Box2;
	private _rng : SeededRandom;
	private _defaultSpawn : Vec2;

	constructor() {
		super(SystemType.LEVEL);

		this._levelMsg = new GameMessage(GameMessageType.LEVEL_LOAD);
		this._bounds = Box2.zero();
		this._rng = new SeededRandom(0);
		this._defaultSpawn = Vec2.zero();

		this.addProp<MessageObject>({
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
			import: (obj : Box) => { this.setBounds(obj); },
		});
		this.addProp<Vec>({
			export: () => { return this._defaultSpawn.toVec(); },
			import: (obj : Vec) => { this._defaultSpawn.copyVec(obj); },
		});
	}

	levelType() : LevelType { return this._levelMsg.getLevelTypeOr(LevelType.UNKNOWN); }
	levelLayout() : LevelLayout { return this._levelMsg.getLevelLayoutOr(LevelLayout.NORMAL); }
	seed() : number { return this._levelMsg.getLevelSeedOr(0); }
	version() : number { return this._levelMsg.getLevelVersionOr(0); }
	bounds() : Box2 { return this._bounds; }
	isCircle() : boolean { return this.levelLayout() === LevelLayout.CIRCLE; }
	clampPos(pos : Vec) : void {
		if (this.isCircle()) {
			pos.x = Fns.wrap(this._bounds.min.x, pos.x, this._bounds.max.x);
		} else {
			pos.x = Fns.clamp(this._bounds.min.x, pos.x, this._bounds.max.x);
		}

		pos.y = Math.min(pos.y, this._bounds.max.y);
	}

	defaultSpawn() : Vec2 { return this._defaultSpawn; }
	
	spawnPlayer(player : Player) : void {
		if (!this.isSource() && player.initialized()) {
			player.respawn(player.profile().pos());
			return;
		}

		if (game.controller().gameState() === GameState.FREE) {
			player.respawn(this._defaultSpawn);
			return;
		}

		const planes = game.entities().getMap(EntityType.PLANE).findN((plane : Entity) => {
			return plane.initialized();
		}, 1);
		if (planes.length === 1) {
			player.respawn(planes[0].profile().pos());
			return;
		}

		const spawns = game.entities().getMap(EntityType.SPAWN_POINT).findAll((spawnPoint : Entity) => {
			return spawnPoint.initialized() && spawnPoint.matchAssociations([AssociationType.TEAM], player);
		});
		if (spawns.length > 0) {
			player.respawn(spawns[0].profile().pos());
			return;
		}

		player.respawn(this._defaultSpawn);
	}

	loadLevel(options : LevelOptions) : void {
		this._levelMsg.setLevelType(options.type);
		this._levelMsg.setLevelLayout(options.layout);
		this._levelMsg.setLevelSeed(options.seed);
		this._levelMsg.setLevelVersion(this.version() + 1);

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
				console.log("%s: deleted entities below current version %d", this.name(), version);
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

		this._levelMsg.setDisplayName(this.displayName());
		this._levelMsg.setLevelBounds(this._bounds.toBox());

    	game.runner().handleMessage(this._levelMsg);

    	if (level === LevelType.LOBBY) {
    		ui.showStatus(StatusType.LOBBY);
    	} else {
    		ui.hideStatus(StatusType.LOBBY);
    	}

		if (isLocalhost()) {
			console.log("%s: loaded level %s with seed %d, version %d", this.name(), LevelType[level], seed, version);
		}
	}

	private setBounds(bounds : Box) : void { this._bounds.copyBox(bounds); }

	private displayName() : string {
		switch (this.levelType()) {
		case LevelType.LOBBY:
			return "the Lobby";
		case LevelType.BIRDTOWN:
			return "Birdtown";
		}
		return "Unknown Level";
	}

	private loadLobby() : void {
		const pos = {x: 0, y: 0};
		let blueprint = new ArchBlueprint({
			level: {
				type: this.levelType(),
				layout: this.levelLayout(),
				seed: this.seed(),
			},
			pos: pos,
		});
		let bounds = Box2.point(pos);

		blueprint.load();
		blueprint.buildings().forEach((building) => {
			building.blocks().forEach((block) => {
				block.entities().forEach((entity) => {
					this.addEntity(entity.type, entity.options);
				});

				const dim = block.dim();
				if (dim.x > 0 && dim.y > 0) {
					bounds.stretch(block.pos(), block.dim());
				}
			});
		});

		bounds.min.add({ y: 8 });
		bounds.max.add({ y: 1 });
		this._defaultSpawn.copyVec(bounds.relativePos(CardinalDir.TOP));
		bounds.max.add({ y: 15 });

		this.setBounds(bounds.toBox());
	}

	private loadBirdtown() : void {
		const pos = {x: 0, y: 0};
		let blueprint = new ArchBlueprint({
			level: {
				type: this.levelType(),
				layout: this.levelLayout(),
				seed: this.seed(),
			},
			pos: pos,
		});
		let bounds = Box2.point(pos);

		blueprint.load();
		blueprint.buildings().forEach((building) => {
			building.blocks().forEach((block) => {
				block.entities().forEach((entity) => {
					this.addEntity(entity.type, entity.options);
				});

				bounds.stretch(block.pos(), block.dim());
			});
		});

		bounds.min.add({ y: 8 });
		bounds.max.add({ y: 4 });
		this._defaultSpawn.copyVec(bounds.relativePos(CardinalDir.TOP));

		bounds.max.add({ y: 7 });
		this.addEntity(EntityType.PLANE, {
			profileInit: {
				pos: bounds.relativePos(CardinalDir.TOP_LEFT).add({
					x: bounds.width() / 3,
					y: bounds.max.y,
				}),
			},
		});

		bounds.max.add({ y: 8 });

		this.setBounds(bounds.toBox());
	}

	private addEntity<T extends Entity>(type : EntityType, entityOptions : EntityOptions) : [T, boolean] {
		entityOptions.levelVersion = this.version();
		return game.entities().addEntity<T>(type, entityOptions);
	}
}
		