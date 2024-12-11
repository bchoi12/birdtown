
import { game } from 'game'	
import { GameState } from 'game/api'
import { AssociationType, AttributeType } from 'game/component/api'
import { Profile } from 'game/component/profile'
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

type LevelOptions = {
	type : LevelType;
	layout : LevelLayout;
	seed : number;
	numPlayers : number;
	numTeams: number;
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
				this.applyLevel(this._levelMsg);
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
	private seed() : number { return this._levelMsg.getLevelSeedOr(0); }
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
	clampProfile(profile : Profile) : void {
		if (!profile.initialized()) {
			return;
		}

		let pos = profile.pos();

		if (this.isCircle()) {
			const x = Fns.wrap(this._bounds.min.x, pos.x, this._bounds.max.x);
			if (pos.x !== x) {
				profile.execute<Profile>((subProfile : Profile) => {
					subProfile.setAllPos({
						x: subProfile.pos().x + x - pos.x,
						y: subProfile.pos().y,
					});
				});
				pos.x = x;
			}
		} else {
			pos.x = Fns.clamp(this._bounds.min.x, pos.x, this._bounds.max.x);
		}
		pos.y = Math.min(pos.y, this._bounds.max.y);
	}

	hasSpawnFor(entity : Entity) : boolean {
		const spawns = game.entities().getMap(EntityType.SPAWN_POINT).findN((spawnPoint : Entity) => {
			return spawnPoint.valid() && spawnPoint.matchAssociations([AssociationType.TEAM], entity);
		}, 1);
		return spawns.length === 1;
	}
	defaultSpawn() : Vec2 { return this._defaultSpawn; }
	
	spawnPlayer(player : Player) : void {
		if (!this.isSource() && player.valid()) {
			player.getUp();
			return;
		}
		
		if (player.getAttribute(AttributeType.REVIVING)) {
			player.revive();
			return;
		}

		if (game.controller().gameState() === GameState.FREE) {
			player.floatRespawn(this._defaultSpawn);
			return;
		}

		if (game.controller().isTeamMode()) {
			if (this.spawnAtPoint(player)) {
				return;
			}
		}	

		if (this.spawnAtPlane(player)) {
			return;
		}	
		player.respawn(this._defaultSpawn);
	}
	private spawnAtPoint(player : Player) : boolean {
		const spawns = game.entities().getMap(EntityType.SPAWN_POINT).findN((spawnPoint : Entity) => {
			return spawnPoint.valid() && spawnPoint.matchAssociations([AssociationType.TEAM], player);
		}, 1);
		if (spawns.length === 1) {
			player.respawn(spawns[0].profile().pos());
			return true
		}
	}
	private spawnAtPlane(player : Player) : boolean {
		const planes = game.entities().getMap(EntityType.PLANE).findN((plane : Entity) => {
			return plane.valid();
		}, 1);
		if (planes.length === 1) {
			player.floatRespawn(planes[0].profile().pos());
			return true;
		}
	}

	loadLevel(options : LevelOptions) : void {
		this._levelMsg.setLevelType(options.type);
		this._levelMsg.setLevelLayout(options.layout);
		this._levelMsg.setLevelSeed(options.seed);
		this._levelMsg.setLevelVersion(this.version() + 1);
		this._levelMsg.setNumPlayers(options.numPlayers);
		this._levelMsg.setNumTeams(options.numTeams);

		this.applyLevel(this._levelMsg);
	}

	private applyLevel(msg : GameMessage) : void {
		const level = msg.getLevelType();
		const seed = msg.getLevelSeed();
		const version = msg.getLevelVersion();

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
		this.buildLevel(msg);
    	game.runner().handleMessage(msg);

		if (isLocalhost()) {
			console.log("%s: loaded level %s with seed %d, version %d", this.name(), LevelType[level], seed, version);
		}
	}

	private setBounds(bounds : Box) : void { this._bounds.copyBox(bounds); }

	private buildLevel(msg : GameMessage) : void {
		const pos = {x: 0, y: 0};
		let blueprint = new ArchBlueprint({
			msg: msg,
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

	override addEntity<T extends Entity>(type : EntityType, entityOptions : EntityOptions) : [T, boolean] {
		entityOptions.levelVersion = this.version();
		return super.addEntity<T>(type, entityOptions);
	}
}
		