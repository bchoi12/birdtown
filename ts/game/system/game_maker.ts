
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
import { ClientConfig } from 'game/util/client_config'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType} from 'message/game_message'
import { GameConfigMessage } from 'message/game_config_message'

import { ui } from 'ui'
import { AnnouncementType, DialogType, FeedType, InfoType, StatusType } from 'ui/api'

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
	private _clientConfig : ClientConfig;
	private _round : number;
	private _winners : Array<Tablet>;
	private _winnerId : number;
	private _errorMsg : string;

	constructor() {
		super(SystemType.GAME_MAKER);

		this._config = GameConfigMessage.defaultConfig(GameMode.UNKNOWN);
		this._clientConfig = ClientConfig.empty();
		this._round = 0;
		this._winners = new Array();
		this._winnerId = 0;
		this._errorMsg = "";

		this.addProp<MessageObject>({
			export: () => { return this._config.exportObject(); },
			import: (obj : MessageObject) => { this._config.parseObject(obj); },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			export: () => { return this._winnerId; },
			import: (obj : number) => { this._winnerId = obj; },
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

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.CLIENT_DISCONNECT) {
			return;
		}

		if (this._clientConfig.hasClient(msg.getClientId())) {
			this._clientConfig.setDisconnected(msg.getClientId(), true);
		}
	}

	mode() : GameMode { return this._config.type(); }
	round() : number { return this._round; }
	winnerId() : number { return this._winnerId; }
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
			return this._clientConfig.numPlayers() * GameMaker._limitPerPlayer.get(this._config.getHealthCrateSpawn());
		case EntityType.WEAPON_CRATE:
			return this._clientConfig.numPlayers() * GameMaker._limitPerPlayer.get(this._config.getWeaponCrateSpawn());
		default:
			return Infinity;
		}
	}

	setConfig(config : GameConfigMessage, clientConfig : ClientConfig) : boolean {
		this._config = config;
		this._clientConfig = clientConfig;

		if (!this._config.valid()) {
			console.error("Error: invalid config", this._config);
			return false;
		}

		if (!this.valid(GameState.LOAD)) {
			return false;
		}

		game.tablets().reset();
		this.addNameParams({
			type: GameMode[this._config.type()],
		});

		if (isLocalhost()) {
			console.log("%s: config is", this.name(), this._config.dataMap());
			console.log("%s: client config is ", this.name(), this._clientConfig.clientMap());
		}
		return true;
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
			return ["Free for All", "Be the first to reach " + config.getPoints() + " points"];
		case GameMode.PRACTICE:
			return ["Practice", "Use the tray to exit practice mode"];
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
			if (this._clientConfig.numPlayers() < this._config.getPlayersMinOr(1)) {
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
					return this._clientConfig.isPlayer(tablet.clientId()) && !tablet.outOfLives();
				});
				if (this._winners.length <= 1) {
					this._winnerId = this._winners[0].entityId();
					return GameState.FINISH;
				}
			} else if (this._config.hasPoints()) {
				this._winners = game.tablets().findAll<Tablet>((tablet : Tablet) => {
					return this._clientConfig.isPlayer(tablet.clientId()) && tablet.getInfo(InfoType.SCORE) >= this._config.getPoints();
				});
				if (this._winners.length >= 1) {
					this._winnerId = this._winners[0].entityId();
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
				return this._clientConfig.isPlayer(playerState.clientId())
					&& playerState.validTargetEntity();
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

		if (!this.isSource()) {
			return;
		}

		switch (state) {
		case GameState.FREE:
			this._round = 0;
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

			game.tablets().executeIf<Tablet>((tablet : Tablet) => {
				tablet.resetRound();
				if (this._config.hasLives()) {
					tablet.setInfo(InfoType.LIVES, this._config.getLives());
				} else {
					tablet.clearInfo(InfoType.LIVES);
				}
			}, (tablet : Tablet) => {
				return this._clientConfig.isPlayer(tablet.clientId());
			});
			game.playerStates().execute((playerState : PlayerState) => {
				playerState.setRole(this._clientConfig.role(playerState.clientId()));
			});
			game.level().loadLevel({
				type: LevelType.BIRDTOWN,
				layout: LevelLayout.CIRCLE,
				seed: Math.floor(Math.random() * 10000),
			});
			break;
		case GameState.SETUP:
			game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
				clientDialog.queueDialog(DialogType.LOADOUT);
			}, (clientDialog : ClientDialog) => {
				return this._clientConfig.isPlayer(clientDialog.clientId());
			});
			break;
		case GameState.GAME:
			game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
				clientDialog.queueForceSubmit(DialogType.LOADOUT);
			}, (clientDialog : ClientDialog) => {
				return this._clientConfig.isPlayer(clientDialog.clientId()) && !clientDialog.inSync(DialogType.LOADOUT);
			});
			game.playerStates().executeIf<PlayerState>((playerState : PlayerState) => {
				playerState.setRole(PlayerRole.SPAWNING);
			}, (playerState : PlayerState) => {
				return this._clientConfig.isPlayer(playerState.clientId());
			});

			const nameAndGoal = GameMaker.nameAndGoal(this._config);
			nameAndGoal[0] += " (Round " + this._round + ")";

	    	let startGameMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	startGameMsg.setAnnouncementType(AnnouncementType.GENERIC);
	    	startGameMsg.setNames(nameAndGoal);
	    	game.announcer().broadcast(startGameMsg);
			break;
		case GameState.FINISH:
			game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
				clientDialog.queueForceSubmit(DialogType.LOADOUT);
			}, (clientDialog : ClientDialog) => {
				return this._clientConfig.isPlayer(clientDialog.clientId()) && !clientDialog.inSync(DialogType.LOADOUT);
			});
			this._winners.forEach((tablet : Tablet) => {
				tablet.addInfo(InfoType.VICTORIES, 1);
			});

	    	let winnerMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	winnerMsg.setAnnouncementType(AnnouncementType.GAME_FINISH);
	    	winnerMsg.setNames(this._winners.map((tablet : Tablet) => { return tablet.displayName(); }));
	    	game.announcer().broadcast(winnerMsg);
			break;
		case GameState.VICTORY:
	    	let victorMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	victorMsg.setAnnouncementType(AnnouncementType.GAME_VICTORY);
	    	victorMsg.setNames(this._winners.map((tablet : Tablet) => { return tablet.displayName(); }));
	    	game.announcer().broadcast(victorMsg);
			break;
		case GameState.END:
	    	let endMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	endMsg.setAnnouncementType(AnnouncementType.GAME_END);
	    	game.announcer().broadcast(endMsg);
	    	break;
		case GameState.ERROR:
	    	let errorMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	errorMsg.setAnnouncementType(AnnouncementType.GAME_ERROR);
	    	errorMsg.setNames([this._errorMsg]);
	    	game.announcer().broadcast(errorMsg);
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
}
