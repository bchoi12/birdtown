
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { AssociationType } from 'game/component/api'
import { EntityType, FrequencyType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { SystemBase, System } from 'game/system'
import { SystemType, LevelType, LevelLayout, PlayerRole } from 'game/system/api'
import { ClientDialog } from 'game/system/client_dialog'
import { Controller } from 'game/system/controller'
import { PlayerState } from 'game/system/player_state'
import { Tablet } from 'game/system/tablet'
import { PlayerConfig } from 'game/util/player_config'

import { MessageObject } from 'message'
import { GameConfigMessage } from 'message/game_config_message'
import { GameMessage, GameMessageType} from 'message/game_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { AnnouncementType, DialogType, FeedType, InfoType, StatusType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'

import { isLocalhost } from 'util/common'

export class GameMaker extends SystemBase implements System {

	private static readonly _lastDamageTime = 10000;
	private static readonly _endTimeLimit = 3000;
	private static readonly _loadTimeLimit = 1500;
	private static readonly _respawnTime = 2000;
	private static readonly _spawnTime = 5000;

	private static readonly _timeLimitBuffer = new Map<GameState, number>([
		// Large buffer to allow dialogs to cleanly force submit and sync
		[GameState.SETUP, 5000],
	]);

	private static readonly _limitPerPlayer = new Map<FrequencyType, number>([
		[FrequencyType.NEVER, 0],
		[FrequencyType.LOW, 0.67],
		[FrequencyType.MEDIUM, 1.5],
		[FrequencyType.HIGH, 2],
	]);

	private _config : GameConfigMessage;
	private _round : number;
	private _winners : Array<Tablet>;
	private _winnerClientId : number;
	private _errorMsg : string;

	constructor() {
		super(SystemType.GAME_MAKER);

		this._config = GameConfigMessage.defaultConfig(GameMode.UNKNOWN);
		this._round = 0;
		this._winners = new Array();
		this._winnerClientId = 0;
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
			import: (obj : number) => { this.setWinnerClientId(obj); },
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

	mode() : GameMode { return this._config.type(); }
	round() : number { return this._round; }
	winnerClientId() : number { return this._winnerClientId; }
	setWinnerClientId(clientId : number) : void {
		this._winnerClientId = clientId;

		ui.highlightPlayer(this._winnerClientId);
	}
	timeLimit(state : GameState) : number {
		switch (state) {
		case GameState.LOAD:
			return GameMaker._loadTimeLimit;
		case GameState.SETUP:
			return this._config.getTimeSetupOr(Infinity);
		case GameState.GAME:
			return this._config.getTimeGameOr(Infinity);
		case GameState.FINISH:
			return this._config.getTimeFinishOr(Infinity);
		case GameState.VICTORY:
			return this._config.getTimeVictoryOr(Infinity);
		case GameState.END:
			return GameMaker._endTimeLimit;
		case GameState.ERROR:
			return this._config.getTimeErrorOr(Infinity);
		default:
			return Infinity;
		}
	}
	private timeLimitReached(state : GameState) : boolean {
		const buffer = GameMaker._timeLimitBuffer.has(state) ? GameMaker._timeLimitBuffer.get(state) : 0;
		return game.controller().stateMillis() >= this.timeLimit(state) + buffer;
	}

	entityLimit(type : EntityType) : number {
		switch (type) {
		case EntityType.HEALTH_CRATE:
			return game.playerStates().numPlayers() * GameMaker._limitPerPlayer.get(this._config.getHealthCrateSpawn());
		case EntityType.WEAPON_CRATE:
			return game.playerStates().numPlayers() * GameMaker._limitPerPlayer.get(this._config.getWeaponCrateSpawn());
		default:
			return Infinity;
		}
	}

	setConfig(config : GameConfigMessage, playerConfig : PlayerConfig) : boolean {
		this._config = config;

		if (!this._config.valid()) {
			console.error("Error: invalid config", this._config);
			return false;
		}

		if (!this.valid(GameState.LOAD)) {
			return false;
		}

		this.addNameParams({
			type: GameMode[this._config.type()],
		});

		game.playerStates().updatePlayers(playerConfig);
		game.tablets().execute<Tablet>((tablet : Tablet) => {
			tablet.resetForLobby();
		});
		ui.setGameMode(this._config.type());

		if (isLocalhost()) {
			console.log("%s: config is", this.name(), this._config.dataMap());
			console.log("%s: client config is ", this.name(), playerConfig.playerMap());
		}
		return true;
	}
	private importConfig(obj : MessageObject) : void {
		let config = GameConfigMessage.defaultConfig(GameMode.UNKNOWN);
		config.parseObject(obj);

		if (!config.valid()) {
			console.error("Error: failed to import invalid config", config, obj);
			return;
		}

		this._config = config;
		game.tablets().execute<Tablet>((tablet : Tablet) => {
			tablet.resetForLobby();
		});
		ui.setGameMode(this._config.type());
	}
	static canStart(mode : GameMode) : [boolean, string] {
		const config = GameConfigMessage.defaultConfig(mode);
		if (game.tablets().numSetup() < config.getPlayersMinOr(1)) {
			return [false, "Need " + config.getPlayersMin() + " players for this game mode! Current number of players: " + game.tablets().numSetup()];
		}
		return [true, ""];
	}
	static nameAndGoal(config : GameConfigMessage) : [string, string] {
		switch (config.type()) {
		case GameMode.DUEL:
			return ["Duel", "Win the 1v1"];
		case GameMode.FREE_FOR_ALL:
			return ["Free for All", "Be the first to score " + config.getPoints() + (config.getPoints() > 1 ? " points" : " point")];
		case GameMode.PRACTICE:
			return ["Practice", "Press " + KeyNames.kbd(settings.menuKeyCode) + " to exit"];
		case GameMode.SURVIVAL:
			return ["Survival", "Be the last one standing"];
		default:
			return ["Unknown Game Mode", "???"];
		}
	}
	valid(current : GameState) : [boolean, string] {
		switch (current) {
		case GameState.LOAD:
		case GameState.SETUP:
		case GameState.GAME:
			if (game.playerStates().numPlayers() < this._config.getPlayersMinOr(1)) {
				return [false, "Not enough players left in the game"];
			}
			break;
		}
		return [true, ""];
	}
	queryState(current : GameState) : GameState {
		const [valid, error] = this.valid(current);
		if (!valid) {
			this._errorMsg = error;
			return GameState.ERROR;
		}

		switch(current) {
		case GameState.LOAD:
			if (this.timeLimitReached(current)) {
				return GameState.SETUP;
			}
			break;
		case GameState.SETUP:
			if (this.timeLimitReached(current)) {
				return GameState.GAME;
			}
			if (game.clientDialogs().inSync(DialogType.LOADOUT)) {
				return GameState.GAME;
			}
			break;
		case GameState.GAME:
			if (this.timeLimitReached(current)) {
				return GameState.FINISH;
			}

			if (this._config.hasLives()) {
				this._winners = game.tablets().findAll<Tablet>((tablet : Tablet) => {
					return !tablet.outOfLives() && this.isPlaying(tablet.clientId());
				});
				if (this._winners.length === 1) {
					this.setWinnerClientId(this._winners[0].clientId());
					return GameState.FINISH;
				} else if (this._winners.length === 0) {
					this.setWinnerClientId(0);
					return GameState.FINISH;
				}
			} else if (this._config.hasPoints()) {
				this._winners = game.tablets().findAll<Tablet>((tablet : Tablet) => {
					return tablet.getInfo(InfoType.SCORE) >= this._config.getPoints() && this.isPlaying(tablet.clientId());
				});
				if (this._winners.length >= 1) {
					this.setWinnerClientId(this._winners[0].clientId());
					return GameState.FINISH;
				}
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
						playerState.setRole(PlayerRole.WAITING);
						playerState.setRoleAfter(PlayerRole.PREPARING, GameMaker._respawnTime, () => {
							if (game.clientDialogs().hasClientDialog(clientId)) {
								game.clientDialog(clientId).queueDialog(DialogType.LOADOUT);
							}
						});
					} else {
						playerState.setRole(PlayerRole.SPECTATING);
					}
				} else if (playerState.role() === PlayerRole.PREPARING) {
					if (game.clientDialog(clientId).inSync(DialogType.LOADOUT)) {
						playerState.setRole(PlayerRole.SPAWNING);
					}
					playerState.setRoleAfter(PlayerRole.SPAWNING, this.timeLimit(GameState.SETUP));
				} else if (playerState.role() === PlayerRole.SPAWNING) {
					playerState.setRoleAfter(PlayerRole.GAMING, GameMaker._spawnTime);
				}
			}, (playerState : PlayerState) => {
				return playerState.isPlaying() && playerState.validTargetEntity() ;
			});
			break;
		case GameState.FINISH:
			if (this.timeLimitReached(current)) {
				if (this._config.hasVictories()) {
					this._winners = game.tablets().findAll<Tablet>((tablet : Tablet) => {
						return tablet.getInfo(InfoType.VICTORIES) >= this._config.getVictories();
					});
					if (this._winners.length >= 1) {
						return GameState.VICTORY;
					}					
				}
				return GameState.LOAD;
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
		if (state !== GameState.FREE) {
			ui.hideStatus(StatusType.LOBBY);
		}

		if (state === GameState.LOAD) {
			ui.showStatus(StatusType.LOADING);
		} else {
			ui.hideStatus(StatusType.LOADING);
		}

		if (state === GameState.SETUP) {
			ui.showStatus(StatusType.SETUP);
		} else {
			ui.hideStatus(StatusType.SETUP);
		}

		if (state === GameState.FINISH || state === GameState.VICTORY) {
			ui.showScoreboard();
		} else {
			ui.hideScoreboard();
		}

		if (!this.isSource()) {
			return;
		}

		switch (state) {
		case GameState.FREE:
			this._round = 0;
			this.setWinnerClientId(0);

			game.level().loadLevel({
				type: LevelType.LOBBY,
				layout: LevelLayout.CIRCLE,
				seed: Math.floor(Math.random() * 10000),
			});
			game.playerStates().execute((playerState : PlayerState) => {
				playerState.resetForLobby();
			});
			break;
		case GameState.LOAD:
			this._round++;
			this.setWinnerClientId(0);

			if (this._round > 1 && this._round % 2 === 1) {
				game.world().incrementTime();
			}

			game.tablets().executeIf<Tablet>((tablet : Tablet) => {
				tablet.resetForRound();
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
			game.level().loadLevel({
				type: LevelType.BIRDTOWN,
				layout: LevelLayout.CIRCLE,
				seed: Math.floor(Math.random() * 10000),
			});

			const nameAndGoal = GameMaker.nameAndGoal(this._config);
			nameAndGoal[0] += " Round " + this._round;

	    	let startGameMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	startGameMsg.setAnnouncementType(AnnouncementType.GENERIC);
	    	startGameMsg.setNames(nameAndGoal);
	    	game.announcer().broadcast(startGameMsg);
			break;
		case GameState.SETUP:
			game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
				clientDialog.queueDialog(DialogType.LOADOUT);
			}, (clientDialog : ClientDialog) => {
				return this.isPlaying(clientDialog.clientId());
			});
			break;
		case GameState.GAME:
	    	this.queueForceSubmit(DialogType.LOADOUT);

			game.playerStates().executeIf<PlayerState>((playerState : PlayerState) => {
				playerState.setRole(PlayerRole.SPAWNING);
			}, (playerState : PlayerState) => {
				return playerState.isPlaying();
			});
			break;
		case GameState.FINISH:
			game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
				clientDialog.queueForceSubmit(DialogType.LOADOUT);
			}, (clientDialog : ClientDialog) => {
				return this.isPlaying(clientDialog.clientId()) && !clientDialog.inSync(DialogType.LOADOUT);
			});
			this._winners.forEach((tablet : Tablet) => {
				tablet.addInfo(InfoType.VICTORIES, 1);
			});

	    	let winnerMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	winnerMsg.setAnnouncementType(AnnouncementType.GAME_FINISH);
	    	winnerMsg.setNames(this._winners.map((tablet : Tablet) => { return tablet.displayName(); }));
	    	winnerMsg.setTtl(this.timeLimit(GameState.FINISH) - 1000);
	    	game.announcer().broadcast(winnerMsg);
			break;
		case GameState.VICTORY:
	    	let victorMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	victorMsg.setAnnouncementType(AnnouncementType.GAME_VICTORY);
	    	victorMsg.setNames(this._winners.map((tablet : Tablet) => { return tablet.displayName(); }));
	    	victorMsg.setTtl(this.timeLimit(GameState.VICTORY) - 1000);
	    	game.announcer().broadcast(victorMsg);
			break;
		case GameState.END:
	    	let endMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	endMsg.setAnnouncementType(AnnouncementType.GAME_END);
	    	game.announcer().broadcast(endMsg);

	    	this.queueForceSubmit(DialogType.LOADOUT);
	    	break;
		case GameState.ERROR:
	    	let errorMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);     
	    	errorMsg.setAnnouncementType(AnnouncementType.GAME_ERROR);
	    	errorMsg.setNames([this._errorMsg]);
	    	game.announcer().broadcast(errorMsg);

	    	this.queueForceSubmit(DialogType.LOADOUT);
	    	break;
		}
	}

	private processKillOn(player : Player) : void {
		let tablet = game.tablet(player.clientId());
		tablet.loseLife();

		const [log, hasLog] = player.stats().lastDamager(GameMaker._lastDamageTime);
		if (!hasLog || !log.hasEntityLog()) {
			let feed = new GameMessage(GameMessageType.FEED);
			feed.setFeedType(FeedType.SUICIDE);
			feed.setNames([tablet.displayName()]);
			game.announcer().broadcast(feed);
			return;
		}

		// Update tablet for last damager.
		const associations = log.entityLog().associations();
		if (associations.has(AssociationType.OWNER)) {
			const damagerId = associations.get(AssociationType.OWNER);
			const [damager, hasDamager] = game.entities().getEntity(damagerId);

			if (hasDamager && game.tablets().hasTablet(damager.clientId())) {
				const damagerTablet = game.tablet(damager.clientId())
				damagerTablet.addInfo(InfoType.KILLS, 1);

				let feed = new GameMessage(GameMessageType.FEED);
				feed.setFeedType(FeedType.KILL);
				feed.setNames([damagerTablet.displayName(), tablet.displayName()]);
				game.announcer().broadcast(feed);
			}
		}
	}

	private isPlaying(clientId : number) : boolean {
		return game.playerStates().hasPlayerState(clientId) && game.playerState(clientId).isPlaying();
	}

	private queueForceSubmit(type : DialogType) : void {
		game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
			clientDialog.queueForceSubmit(type);
		}, (clientDialog : ClientDialog) => {
			return this.isPlaying(clientDialog.clientId()) && !clientDialog.inSync(type);
		});
	}
}
