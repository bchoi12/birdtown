
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { AssociationType, TeamType } from 'game/component/api'
import { EntityType, FrequencyType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { BuffType } from 'game/factory/api'
import { BuffFactory } from 'game/factory/buff_factory'
import { ConfigFactory } from 'game/factory/config_factory'
import { EquipFactory } from 'game/factory/equip_factory'
import { SystemBase, System } from 'game/system'
import { SystemType, AmbianceType, LevelType, LoadoutType, PlayerRole, WinConditionType } from 'game/system/api'
import { ClientDialog } from 'game/system/client_dialog'
import { Controller } from 'game/system/controller'
import { PlayerState } from 'game/system/player_state'
import { Tablet } from 'game/system/tablet'
import { PlayerConfig } from 'game/util/player_config'
import { PlayerRotator } from 'game/util/player_rotator'

import { Flags } from 'global/flags'

import { MessageObject } from 'message'
import { GameConfigMessage } from 'message/game_config_message'
import { GameMessage, GameMessageType} from 'message/game_message'

import { settings } from 'settings'

import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { AnnouncementType, DialogType, FeedType, InfoType } from 'ui/api'

import { Optional } from 'util/optional'
import { globalRandom } from 'util/seeded_random'

export class GameMaker extends SystemBase implements System {

	private static readonly _announcementBuffer = 500;
	private static readonly _lastDamageTime = 15000;
	private static readonly _finishTimeLimit = 3000;
	private static readonly _victoryTimeLimit = 7500;
	private static readonly _endTimeLimit = 2500;
	private static readonly _errorTimeLimit = 5000;
	private static readonly _preloadTimeLimit = 1500;
	private static readonly _loadTimeLimit = 2500;
	private static readonly _respawnTime = 2500;

	private static readonly _timeLimitBuffer = new Map<GameState, number>([
		// Large buffer to allow dialogs to cleanly force submit and sync
		[GameState.SETUP, 3000],
	]);

	private static readonly _limitPerPlayer = new Map<FrequencyType, number>([
		[FrequencyType.NEVER, 0],
		[FrequencyType.RARE, 0.25],
		[FrequencyType.LOW, 0.5],
		[FrequencyType.MEDIUM, 1],
		[FrequencyType.HIGH, 2],
		[FrequencyType.UBIQUITOUS, 3],
	]);

	private _config : GameConfigMessage;
	private _playerConfig : PlayerConfig;
	private _playerRotator : PlayerRotator;
	private _round : number;
	private _equipPair : [EntityType, EntityType];
	private _currentLevel : LevelType;
	private _vipIds : Optional<Set<number>>;
	private _winners : Array<number>;
	private _winnerClientId : number;
	private _winningTeam : number;
	private _errorMsg : string;

	constructor() {
		super(SystemType.GAME_MAKER);

		this._config = ConfigFactory.empty();
		this._playerConfig = PlayerConfig.empty();
		this._playerRotator = new PlayerRotator();
		this._round = 0;
		this._equipPair = [EntityType.UNKNOWN, EntityType.UNKNOWN];
		this._currentLevel = LevelType.UNKNOWN;
		this._vipIds = new Optional();
		this._winners = new Array();
		this._winnerClientId = 0;
		this._winningTeam = TeamType.UNKNOWN;
		this._errorMsg = "";

		this.addProp<MessageObject>({
			export: () => { return this._config.exportObject(); },
			import: (obj : MessageObject) => { this.importConfig(obj); },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			export: () => { return this._winnerClientId; },
			import: (obj : number) => { this._winnerClientId = obj; },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<TeamType>({
			export: () => { return this._winningTeam; },
			import: (obj : number) => { this._winningTeam = obj; },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			export: () => { return this._round; },
			import: (obj : number) => { this._round = obj; },
			options: {
				filters: GameData.tcpFilters,
			},
		});
	}

	config() : GameConfigMessage { return this._config; }
	mode() : GameMode { return this._config.type(); }
	round() : number { return this._round; }
	winnerClientId() : number { return this._winnerClientId; }
	winningTeam() : number { return this._winningTeam; }
	isTeamMode() : boolean {
		if (game.playerStates().numPlayers() <= 2) {
			return false;
		}
		return this._config.getWinCondition() === WinConditionType.TEAM_LIVES || this._config.getWinCondition() === WinConditionType.TEAM_POINTS;
	}
	setWinnerClientId(clientId : number) : void {
		if (!game.playerStates().hasPlayerState(clientId)) {
			this._winnerClientId = 0;
			this._winningTeam = TeamType.UNKNOWN;
			return;
		}

		this._winnerClientId = clientId;
		this._winningTeam = game.playerState(clientId).team();
	}
	timeLimit(state : GameState) : number {
		switch (state) {
		case GameState.PRELOAD:
			return GameMaker._preloadTimeLimit;
		case GameState.LOAD:
			return GameMaker._loadTimeLimit;
		case GameState.SETUP:
			return this._config.getTimeSetupOr(Infinity);
		case GameState.GAME:
			return this._config.getTimeGameOr(Infinity);
		case GameState.FINISH:
			return GameMaker._finishTimeLimit;
		case GameState.VICTORY:
			return GameMaker._victoryTimeLimit;
		case GameState.END:
			return GameMaker._endTimeLimit;
		case GameState.ERROR:
			return GameMaker._errorTimeLimit;
		default:
			return Infinity;
		}
	}
	private timeLimitReached(state : GameState) : boolean {
		const buffer = GameMaker._timeLimitBuffer.has(state) ? GameMaker._timeLimitBuffer.get(state) : 0;
		return game.controller().stateMillis() >= this.timeLimit(state) + buffer;
	}

	entityLimit(type : EntityType) : number {
		const players = Math.max(2, game.playerStates().numPlayers());

		return Math.ceil(players * this.limitPerPlayer(type));
	}
	private limitPerPlayer(type : EntityType) : number {
		switch (type) {
		case EntityType.HEALTH_CRATE:
			return GameMaker._limitPerPlayer.get(this._config.getHealthCrateSpawnOr(0));
		case EntityType.WEAPON_CRATE:
			return GameMaker._limitPerPlayer.get(this._config.getWeaponCrateSpawnOr(0));
		default:
			return Infinity;
		}
	}

	getEquips(clientId : number) : [EntityType, EntityType] {
		if (this._config.type() === GameMode.FREE) {
			const loadout = game.clientDialog(clientId)?.message(DialogType.LOADOUT);
			if (loadout && loadout.getEquipType() !== EntityType.UNKNOWN && loadout.getAltEquipType() !== EntityType.UNKNOWN) {
				return [loadout.getEquipType(), loadout.getAltEquipType()];
			}

			return EquipFactory.nextDefaultPair();
		}

		if (this.isVIP(clientId)) {
			return [EntityType.GOLDEN_GUN, EntityType.TOP_HAT];
		}

		if (this._config.getStartingLoadout() === LoadoutType.GOLDEN_GUN) {
			return [EntityType.GOLDEN_GUN, EntityType.TOP_HAT];
		} else if (this._config.getStartingLoadout() === LoadoutType.RANDOM) {
			return EquipFactory.random();
		} else if (this._config.getStartingLoadout() === LoadoutType.RANDOM_ALL) {
			return this._equipPair;
		}

		let nextClientId = 0;
		if (this._config.getStartingLoadout() === LoadoutType.CHOOSE
			|| this._config.getStartingLoadout() === LoadoutType.PICK
			|| this._config.getStartingLoadout() === LoadoutType.BUFF) {
			nextClientId = clientId;
		} else if (this._config.getStartingLoadout() === LoadoutType.CHOOSE_TURNS || this._config.getStartingLoadout() === LoadoutType.PICK_TURNS) {
			nextClientId = this._playerRotator.current();
		}

		if (nextClientId === 0) {
			console.error("Error: trying to get equips for ID 0")
		} else if (Flags.printDebug.get()) {
			console.log("%s: using client ID %d for equips", this.name(), nextClientId);
		}

		if (game.clientDialogs().hasClientDialog(nextClientId)) {
			const loadout = game.clientDialog(nextClientId).message(DialogType.LOADOUT);
			return [loadout.getEquipType(), loadout.getAltEquipType()];
		}
		return EquipFactory.random();
	}

	rematch(mode : GameMode) : boolean {
		// Replay last level without saving it to ConfigFactory
		let config = ConfigFactory.load(mode);
		if (config.getLevelType() === LevelType.RANDOM && this._currentLevel !== LevelType.UNKNOWN) {
			config.setLevelType(this._currentLevel);
		}
		return this.setConfig(config, this._playerConfig); }
	setConfig(config : GameConfigMessage, playerConfig : PlayerConfig, rematch? : boolean) : boolean {
		this._config = config;

		if (!this._config.valid()) {
			console.error("Error: invalid config", this._config.errors().join(", "));
			return false;
		}

		const [error, valid] = this.checkState(GameState.LOAD);
		if (!valid) {
			console.error("Error:", error);
			return false;
		}

		this._playerConfig = playerConfig;
		this._playerConfig.removeInvalid();
		const [errors, ok] = this._playerConfig.canPlay(config);
		if (!ok) {
			console.error("Player config invalid:", errors.join(", "));
			return false;
		}

		this.addNameParams({
			type: GameMode[this._config.type()],
		});

		if (this._config.getLevelType() === LevelType.RANDOM) {
			this._currentLevel = game.level().randomLevel();
		} else {
			this._currentLevel = this._config.getLevelType();
		}

		this._playerRotator.seed(this._config.getLevelSeed());
		this._playerRotator.updateShuffled(playerConfig);
		game.playerStates().updatePlayers(playerConfig);
		game.tablets().execute<Tablet>((tablet : Tablet) => {
			tablet.resetForGame(this._config);
		});
		ui.setGameConfig(this._config);

		if (Flags.printDebug.get()) {
			console.log("%s: set config", this.name(), this._config.dataMap());
			console.log("%s: client config is ", this.name(), playerConfig.playerMap());
		}
		return true;
	}
	private importConfig(obj : MessageObject) : void {
		let config = ConfigFactory.empty();
		config.parseObject(obj);

		if (!config.valid()) {
			console.error("Error: failed to import invalid config", config.errors().join(", "));
			return;
		}

		this._config = config;
		game.tablets().execute<Tablet>((tablet : Tablet) => {
			tablet.resetForGame(this._config);
		});
		ui.setGameConfig(this._config);

		if (Flags.printDebug.get()) {
			console.log("%s: imported config", this.name(), this._config.dataMap());
		}
	}
	checkState(current : GameState) : [string, boolean] {
		switch (current) {
		case GameState.LOAD:
		case GameState.SETUP:
		case GameState.GAME:
			if (game.playerStates().numPlayers() < this._config.getPlayersMinOr(1)) {
				return [`Not enough players left in the game`, false];
			}
			break;
		}
		return ["", true];
	}
	queryState(current : GameState) : GameState {
		const [error, valid] = this.checkState(current);
		if (!valid) {
			this._errorMsg = error;
			return GameState.ERROR;
		}

		switch(current) {
		case GameState.PRELOAD:
			if (this.timeLimitReached(current)) {
				return GameState.LOAD;
			}
			break;
		case GameState.LOAD:
			if (this.timeLimitReached(current)) {
				return GameState.SETUP;
			}
			break;
		case GameState.SETUP:
			if (this.timeLimitReached(current)) {
				return GameState.GAME;
			}
			const inSync = game.clientDialogs().inSync(DialogType.LOADOUT, (clientDialog : ClientDialog) => {
				const clientId = clientDialog.clientId();
				return game.playerStates().hasPlayerState(clientId) && game.playerState(clientId).isPlaying();
			})
			if (inSync) {
				return GameState.GAME;
			}
			break;
		case GameState.GAME:
			if (this.timeLimitReached(current)) {
				return GameState.FINISH;
			}

			const [winners, done] = this.checkWinners();
			if (done) {
				this._winners = winners;
				if (this._winners.length === 1) {
					this.setWinnerClientId(this._winners[0]);
				} else {
					this.setWinnerClientId(0);
				}
				return GameState.FINISH;
			}

			game.playerStates().executeIf((playerState : PlayerState) => {
				const clientId = playerState.clientId();
				const player = playerState.targetEntity<Player>();

				if (playerState.role() === PlayerRole.GAMING) {
					if (!game.clientDialog(clientId).inSync(DialogType.LOADOUT)) {
						game.clientDialog(clientId).queueForceSubmit(DialogType.LOADOUT);
					}

					if (!player.dead()) {
						return;
					}

					this.processKillOn(player);
					if (!game.tablet(clientId).outOfLives()) {
						playerState.waitUntil(PlayerRole.PREPARING, GameMaker._respawnTime, () => {
							if (this._config.getStartingLoadout() !== LoadoutType.CHOOSE && this._config.getStartingLoadout() !== LoadoutType.PICK) {
								return;
							}
							if (game.controller().gameState() !== GameState.GAME) {
								return;
							}
							if (game.clientDialogs().hasClientDialog(clientId)) {
								game.clientDialog(clientId).queueDialog(DialogType.LOADOUT);
							}
						});
					} else {
						// Without delay winner pan does not work since SPECTATING will spectate winner early
						playerState.waitUntil(PlayerRole.SPECTATING, GameMaker._respawnTime);
					}
				} else if (playerState.role() === PlayerRole.PREPARING) {
					if (game.clientDialog(clientId).inSync(DialogType.LOADOUT)) {
						playerState.setRole(PlayerRole.SPAWNING);
					}
				}
			}, (playerState : PlayerState) => {
				return playerState.isPlaying() && playerState.validTargetEntity();
			});
			break;
		case GameState.FINISH:
			if (this.timeLimitReached(current)) {
				if (this._config.hasVictories()) {
					this._winners = game.tablets().mapIf<Tablet, number>((tablet : Tablet) => {
						return tablet.clientId();
					}, (tablet : Tablet) => {
						return tablet.getInfo(InfoType.VICTORIES) >= this._config.getVictories();
					});
					if (this._winners.length >= 1) {
						return GameState.VICTORY;
					}					
				}
				return GameState.PRELOAD;
			}
			break;
		case GameState.VICTORY:
		case GameState.END:
		case GameState.ERROR:
			if (this.timeLimitReached(current)) {
				return GameState.FREE;
			}
			break;
		}
		return current;
	}
	setGameState(state : GameState) : void {
		if (!this.isSource()) {
			return;
		}

		switch (state) {
		case GameState.FREE:
			game.audio().fadeMusic();
			this._config.resetToDefault(GameMode.FREE);
			ui.setGameConfig(this._config);

			this._round = 0;
			this.setWinnerClientId(0);
			this.assignRoles();

			game.level().loadLevel({
				type: this._config.getLevelType(),
				layout: this._config.getLevelLayout(),
				seed: this._config.getLevelSeed(),
				numPlayers: 0,
				numTeams: 0,
			});

			game.playerStates().execute((playerState : PlayerState) => {
				playerState.resetForLobby();
			});

			game.audio().setAmbiance(this.getAmbiance());
			break;
		case GameState.PRELOAD:
			if (this._round === 0) {
		    	game.announcer().announce({
		    		type: AnnouncementType.GAME_STARTING,
		    		names: [this._config.modeName()],
		    		ttl: this.timeLimit(state),
		    	});
			}
	    	break;
		case GameState.LOAD:
			this._round++;

			if (this._round > 1 && this._round % 2 === 1) {
				game.world().incrementTime();
			}

			game.tablets().executeIf<Tablet>((tablet : Tablet) => {
				tablet.resetForRound(this._config);
				if (this._config.hasLives()) {
					tablet.setInfo(InfoType.LIVES, this._config.getLives());
				} else {
					tablet.clearInfo(InfoType.LIVES);
				}
			}, (tablet : Tablet) => {
				return this.isPlaying(tablet.clientId());
			});
			game.playerStates().execute((playerState : PlayerState) => {
				playerState.onStartRound();
			});

			const [numPlayers, numTeams] = this._playerConfig.numPlayersAndTeams();
			game.level().loadLevel({
				type: this._currentLevel,
				layout: this._config.getLevelLayout(),
				seed: this._config.getLevelSeed() + this._round,
				numPlayers: numPlayers,
				numTeams: numTeams,
			});

			let name;
			if (this._config.type() === GameMode.PRACTICE) {
				name = this._config.modeName();
			} else {
				name = this._config.modeName() + " Round " + this._round;
			}
			const description = StringFactory.getModeDescription(this._config);
	    	game.announcer().announce({
	    		type: AnnouncementType.GENERIC,
	    		names: [name, description],
	    		ttl: this.timeLimit(state) + GameMaker._announcementBuffer,
	    	});

			game.audio().setAmbiance(this.getAmbiance());
			
			break;
		case GameState.SETUP:
			this.assignRoles();
			this.setupPlayers();
			this.setWinnerClientId(0);
			break;
		case GameState.GAME:
			// This shouldn't be necessary, but clear just in case.
	    	this.queueForceSubmit(DialogType.LOADOUT);

			this.applyBuffs();		

			game.playerStates().executeIf<PlayerState>((playerState : PlayerState) => {
				playerState.setVIP(this.isVIP(playerState.clientId()));
				playerState.setRole(PlayerRole.SPAWNING);
			}, (playerState : PlayerState) => {
				return playerState.isPlaying();
			});
			break;
		case GameState.FINISH:
			this.queueForceSubmit(DialogType.LOADOUT);
			this._winners.forEach((clientId : number) => {
				if (game.tablets().hasTablet(clientId)) {
					game.tablet(clientId).addInfo(InfoType.VICTORIES, 1);
					game.tablet(clientId).setWinner(true);
				}
			});

	    	game.announcer().announce({
	    		type: AnnouncementType.GAME_FINISH,
	    		names: this.winnerNames(),
	    		ttl: this.timeLimit(GameState.FINISH) - GameMaker._announcementBuffer,
	    	});
			break;
		case GameState.VICTORY:
			this._winners.forEach((clientId : number) => {
				if (game.tablets().hasTablet(clientId)) {
					game.tablet(clientId).addInfo(InfoType.WINS, 1);
				}
			});
	    	game.announcer().announce({
	    		type: AnnouncementType.GAME_VICTORY,
	    		names: this.winnerNames(),
	    		ttl: this.timeLimit(GameState.VICTORY) - GameMaker._announcementBuffer,
	    	});
			break;
		case GameState.END:
	    	game.announcer().announce({
	    		type: AnnouncementType.GAME_END,
	    	});
	    	this.queueForceSubmit(DialogType.LOADOUT);
	    	break;
		case GameState.ERROR:
	    	game.announcer().announce({
	    		type: AnnouncementType.GAME_ERROR,
	    		names: [this._errorMsg],
	    	});

	    	this.queueForceSubmit(DialogType.LOADOUT);
	    	break;
		}
	}

	private processKillOn(player : Player) : void {
		let tablet = game.tablet(player.clientId());
		tablet.loseLife();

		if (this._config.getResetPointsOr(false)) {
			tablet.setInfo(InfoType.SCORE, 0);
		}

		const [log, hasLog] = player.lastDamager(GameMaker._lastDamageTime);
		if (!hasLog || !log.hasEntityLog()) {
	    	game.announcer().feed({
	    		type: FeedType.SUICIDE,
	    		names: [tablet.displayName()],
	    	});
			return;
		}

		// Update tablet for last damager.
		const associations = log.entityLog().associations();
		if (associations.has(AssociationType.OWNER)) {
			const damagerId = associations.get(AssociationType.OWNER);
			const [damager, hasDamager] = game.entities().getEntity<Player>(damagerId);

			if (hasDamager && game.tablets().hasTablet(damager.clientId())) {
				const damagerTablet = game.tablet(damager.clientId())

				if (damager.sameTeam(player)) {
					damagerTablet.addTeamKill();
				} else {
					if (this._config.type() === GameMode.GOLDEN_GUN) {
						if (damager.equipType() === EntityType.GOLDEN_GUN) {
							damagerTablet.addPointKill();
						} else {
							// Upgrade weapon
							damager.createEquips(EntityType.GOLDEN_GUN, EntityType.TOP_HAT);
						}
					} else {
						damagerTablet.addPointKill();

						switch (this._config.type()) {
						case GameMode.SPREE:
							damager.addBuff(BuffType.SPREE, 1);
							break;
						}
					}
				}

		    	game.announcer().feed({
		    		type: FeedType.KILL,
		    		names: [damagerTablet.displayName(), tablet.displayName()],
		    	});

				if (this._config.getWinCondition() === WinConditionType.POINTS
					&& damagerTablet.getInfo(InfoType.SCORE) === this._config.getPoints() - 1) {
			    	game.announcer().feed({
			    		type: FeedType.ONE_MORE,
			    		names: [damagerTablet.displayName()],
			    	});
				}
			}
		}
	}

	private isPlaying(clientId : number) : boolean {
		return game.playerStates().hasPlayerState(clientId) && game.playerState(clientId).isPlaying();
	}

	private isVIP(clientId : number) : boolean {
		if (!this._vipIds.has()) {
			return false;
		}
		return this._vipIds.get().has(clientId);
	}
	private assignRoles() : void {
		this._vipIds.clear();
		if (this._config.type() === GameMode.VIP) {
			this._vipIds.set(new Set([this._playerRotator.nextFromTeamOne(), this._playerRotator.nextFromTeamTwo()]));
		}
	}

	private setupPlayers() : void {
		if (this._config.getStartingLoadout() === LoadoutType.RANDOM_ALL) {
			this._equipPair = EquipFactory.next();
			return;
		}

		if (this._config.getStartingLoadout() === LoadoutType.RANDOM
			|| this._config.getStartingLoadout() === LoadoutType.GOLDEN_GUN) {
			return;
		}

		if (this._config.getStartingLoadout() === LoadoutType.CHOOSE_TURNS || this._config.getStartingLoadout() === LoadoutType.PICK_TURNS) {
			let nextId;
			if (this._round === 1) {
				nextId = this._playerRotator.nextN(globalRandom.int(2 * this._playerConfig.numPlayers()));
			} else if (this._winningTeam === TeamType.TEAM_ONE) {
				nextId = this._playerRotator.nextFromTeamTwo();
			} else if (this._winningTeam === TeamType.TEAM_TWO) {
				nextId = this._playerRotator.nextFromTeamOne();
			} else if (this.isPlaying(this._winnerClientId)) {
				nextId = this._playerRotator.nextExcluding(this._winnerClientId);
			} else {
				nextId = this._playerRotator.nextFromAll();
			}

			if (Flags.printDebug.get()) {
				console.log("%s: show dialog from", this.name(), nextId);
			}

			game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
				clientDialog.queueDialog(DialogType.LOADOUT);
			}, (clientDialog : ClientDialog) => {
				return clientDialog.clientId() === nextId;
			});
			return;
		}

		// Clear buffs from last round.
		if (this._config.getStartingLoadout() === LoadoutType.BUFF) {
			game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
				let loadout = clientDialog.message(DialogType.LOADOUT);
				loadout.setBuffType(BuffType.UNKNOWN);
				loadout.setBonusBuffType(BuffType.UNKNOWN);
			}, (clientDialog : ClientDialog) => {
				return this.isPlaying(clientDialog.clientId());
			});
		}

		game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
			clientDialog.queueDialog(DialogType.LOADOUT);
		}, (clientDialog : ClientDialog) => {
			return this.isPlaying(clientDialog.clientId()) && !this.isVIP(clientDialog.clientId());
		});
	}

	private applyBuffs() : void {
		if (this._config.getStartingLoadout() !== LoadoutType.BUFF) {
			// Clean up buffs from previous buff mode
			if (this._round === 1) {
				game.playerStates().executeIf<PlayerState>((playerState : PlayerState) => {
					playerState.targetEntity().clearBuffs();
				}, (playerState : PlayerState) => {
					return playerState.hasTargetEntity();
				});
			}
			return;
		}

		game.playerStates().executeIf<PlayerState>((playerState : PlayerState) => {
			const id = playerState.clientId();
			let loadout = game.clientDialog(id).message(DialogType.LOADOUT);

			if (this._round === 1) {
				playerState.targetEntity().clearBuffs();
			} else if (this._round > 1) {
				playerState.targetEntity().levelUp();	
			}

			if (loadout.hasBuffType() && loadout.getBuffType() !== BuffType.UNKNOWN) {
				playerState.targetEntity().addBuff(loadout.getBuffType(), 1);
			} else if (this._round === 1) {
				console.error("Warning: applying random starter buff");
				playerState.targetEntity().addBuff(BuffFactory.randomStarter(), 1);
			} else {
				console.error("Warning: applying random buff");
				playerState.targetEntity().addBuff(BuffFactory.randomBuff(), 1);
			}

			if (this._round > 1
				&& playerState.onLosingTeam()
				&& loadout.hasBonusBuffType()
				&& loadout.getBonusBuffType() !== BuffType.UNKNOWN) {
				playerState.targetEntity().addBuff(loadout.getBonusBuffType(), 1);
			}

			loadout.setBuffType(BuffType.UNKNOWN);
			loadout.setBonusBuffType(BuffType.UNKNOWN);
		}, (playerState : PlayerState) => {
			return this.isPlaying(playerState.clientId());
		});
	}

	private queueForceSubmit(type : DialogType) : void {
		game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
			clientDialog.queueForceSubmit(type);
		}, (clientDialog : ClientDialog) => {
			return this.isPlaying(clientDialog.clientId()) && !clientDialog.inSync(type);
		});
	}

	private checkWinners() : [Array<number>, boolean] {
		let winners = [];
		switch (this._config.getWinCondition()) {
		case WinConditionType.LIVES:
			winners = this.findTabletIds((tablet : Tablet) => {
				return !tablet.outOfLives() && this.isPlaying(tablet.clientId());
			});
			if (winners.length <= 1) {
				return [winners, true];
			}
			break;
		case WinConditionType.POINTS:
			winners = this.findTabletIds((tablet : Tablet) => {
				return tablet.getInfo(InfoType.SCORE) >= this._config.getPoints() && this.isPlaying(tablet.clientId());
			});
			if (winners.length >= 1) {
				return [winners, true];
			}
			break;
		case WinConditionType.TEAM_LIVES:
			winners = this.findTabletIds((tablet : Tablet) => {
				return !tablet.outOfLives() && this.isPlaying(tablet.clientId());
			});
			let teams = this.getTeams(winners);
			if (teams.size <= 1) {
				winners = this.findPlayerStateIds((playerState : PlayerState) => {
					return teams.has(playerState.team());
				});
				return [winners, true];
			}
			break;
		case WinConditionType.TEAM_POINTS:
			let teamScores = game.tablets().teamScores();
			winners = this.findPlayerStateIds((playerState : PlayerState) => {
				const team = playerState.team();
				return teamScores.has(team) && teamScores.get(team) >= this._config.getPoints();
			});

			if (winners.length >= 1) {
				return [winners, true];
			}
			break;
		}

		// TODO: add another param for VIP win condition
		if (this._config.type() === GameMode.VIP) {
			let vips = game.playerStates().findAll<PlayerState>((playerState : PlayerState) => {
				return playerState.isVIP() && !playerState.targetEntity<Player>().dead();
			});

			if (vips.length <= 1) {
				const team = vips[0].team();
				winners = this.findPlayerStateIds((playerState : PlayerState) => {
					return team === playerState.team();
				});
				return [winners, true];
			}
		}

		return [winners, false];
	}

	private findTabletIds(predicate : (tablet : Tablet) => boolean) {
		return game.tablets().mapIf<Tablet, number>((tablet : Tablet) => {
			return tablet.clientId();
		}, (tablet : Tablet) => {
			return predicate(tablet);
		});
	}
	private findPlayerStateIds(predicate : (playerState : PlayerState) => boolean) {
		return game.playerStates().mapIf<PlayerState, number>((playerState : PlayerState) => {
			return playerState.clientId();
		}, (playerState : PlayerState) => {
			return predicate(playerState);
		});
	}
	private getTeams(ids : Array<number>) : Set<number> {
		let teams = new Set<number>();
		ids.forEach((clientId : number) => {
			if (game.playerStates().hasPlayerState(clientId)) {
				teams.add(game.playerState(clientId).team());
			}
		});
		return teams;
	}

	private winnerNames() : Array<string> {
		if (this._winners.length > 1) {
			for (let i = 0; i < this._winners.length; ++i) {
				if (game.playerStates().hasPlayerState(this._winners[i])) {
					const team = game.playerState(this._winners[i]).team();
					if (team !== 0) {
						return ["Team " + team];
					}
				}
			}
		}

		if (game.tablets().hasTablet(this._winnerClientId)) {
			return [game.tablet(this._winnerClientId).displayName()];
		}

		if (this._winners.length === 0) {
			return [];
		}

		if (this._winners.length === 1) {
			if (game.tablets().hasTablet(this._winners[0])) {
				return [game.tablet(this._winners[0]).displayName()];
			}
		}
		return [];
	}

	private getAmbiance() : AmbianceType {
		if (this._config.type() === GameMode.FREE) {
			return AmbianceType.PEACEFUL;
		}

		if (!this._config.hasVictories()) {
			return AmbianceType.UPBEAT;
		}

		const victories = this._config.getVictories();
		if (victories <= 0) {
			return AmbianceType.UPBEAT;
		}

		const almostOver = game.tablets().matchAny<Tablet>((tablet : Tablet) => {
			return victories - tablet.getInfo(InfoType.VICTORIES) <= 1;
		});

		if (almostOver) {
			return AmbianceType.DRAMATIC;
		}

		return AmbianceType.UPBEAT;
	}
}
