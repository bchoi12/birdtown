
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { AssociationType } from 'game/component/api'
import { EntityType, FrequencyType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { ConfigFactory } from 'game/factory/config_factory'
import { SystemBase, System } from 'game/system'
import { SystemType, LevelType, LevelLayout, LoadoutType, PlayerRole, WinConditionType } from 'game/system/api'
import { ClientDialog } from 'game/system/client_dialog'
import { Controller } from 'game/system/controller'
import { PlayerState } from 'game/system/player_state'
import { Tablet } from 'game/system/tablet'
import { EquipPairs } from 'game/util/equip_pairs'
import { PlayerConfig } from 'game/util/player_config'
import { PlayerRotator } from 'game/util/player_rotator'

import { MessageObject } from 'message'
import { GameConfigMessage } from 'message/game_config_message'
import { GameMessage, GameMessageType} from 'message/game_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { AnnouncementType, DialogType, FeedType, InfoType, StatusType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'

import { isLocalhost } from 'util/common'
import { SeededRandom } from 'util/seeded_random'

export class GameMaker extends SystemBase implements System {

	private static readonly _lastDamageTime = 15000;
	private static readonly _endTimeLimit = 3000;
	private static readonly _startingTimeLimit = 2000;
	private static readonly _loadTimeLimit = 2000;
	private static readonly _respawnTime = 2000;
	private static readonly _spawnTime = 5000;

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
		[FrequencyType.EVERYWHERE, 3],
	]);

	private _config : GameConfigMessage;
	private _playerConfig : PlayerConfig;
	private _playerRotator : PlayerRotator;
	private _round : number;
	private _winners : Array<number>;
	private _winnerClientId : number;
	private _errorMsg : string;
	private _rng : SeededRandom;

	constructor() {
		super(SystemType.GAME_MAKER);

		this._config = ConfigFactory.empty();
		this._playerConfig = PlayerConfig.empty();
		this._playerRotator = new PlayerRotator();
		this._round = 0;
		this._winners = new Array();
		this._winnerClientId = 0;
		this._errorMsg = "";
		this._rng = new SeededRandom(0);

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

	config() : GameConfigMessage { return this._config; }
	mode() : GameMode { return this._config.type(); }
	round() : number { return this._round; }
	winnerClientId() : number { return this._winnerClientId; }
	setWinnerClientId(clientId : number) : void {
		this._winnerClientId = clientId;
	}
	timeLimit(state : GameState) : number {
		switch (state) {
		case GameState.STARTING:
			return GameMaker._startingTimeLimit;
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
		const players = Math.max(2, game.playerStates().numPlayers());

		return Math.ceil(players * this.limitPerPlayer(type));
	}
	private limitPerPlayer(type : EntityType) : number {
		switch (type) {
		case EntityType.HEALTH_CRATE:
			return GameMaker._limitPerPlayer.get(this._config.getHealthCrateSpawn());
		case EntityType.WEAPON_CRATE:
			return GameMaker._limitPerPlayer.get(this._config.getWeaponCrateSpawn());
		default:
			return Infinity;
		}
	}

	getEquips(clientId : number) : [EntityType, EntityType] {
		if (this._config.type() === GameMode.FREE) {
			return EquipPairs.randomDefaultPair();
		}

		if (this._config.getStartingLoadout() === LoadoutType.RANDOM) {
			return EquipPairs.random();
		}

		let id = 0;
		if (this._config.getStartingLoadout() === LoadoutType.PICK) {
			if (this._config.type() === GameMode.DUEL) {
				id = this._playerRotator.currentFromAll();
			} else {
				id = clientId;
			}
		}

		if (game.clientDialogs().hasClientDialog(id)) {
			const loadout = game.clientDialog(id).message(DialogType.LOADOUT);
			return [loadout.getEquipType(), loadout.getAltEquipType()];
		}
		return EquipPairs.random();
	}

	setConfig(config : GameConfigMessage, playerConfig : PlayerConfig) : boolean {
		this._config = config;

		if (!this._config.valid()) {
			console.error("Error: invalid config", this._config);
			return false;
		}

		const [error, valid] = this.checkState(GameState.LOAD);
		if (!valid) {
			console.error("Error:", error);
			return false;
		}

		this.addNameParams({
			type: GameMode[this._config.type()],
		});

		this._playerConfig = playerConfig;
		this._playerRotator.seed(this._config.getLevelSeed());
		this._playerRotator.updateShuffled(playerConfig);
		game.playerStates().updatePlayers(playerConfig);
		game.tablets().execute<Tablet>((tablet : Tablet) => {
			tablet.resetForGame(this._config);
		});
		ui.setGameConfig(this._config);

		if (isLocalhost()) {
			console.log("%s: config is", this.name(), this._config.dataMap());
			console.log("%s: client config is ", this.name(), playerConfig.playerMap());
		}
		return true;
	}
	private importConfig(obj : MessageObject) : void {
		let config = ConfigFactory.empty();
		config.parseObject(obj);

		if (!config.valid()) {
			console.error("Error: failed to import invalid config", config, obj);
			return;
		}

		this._config = config;
		game.tablets().execute<Tablet>((tablet : Tablet) => {
			tablet.resetForGame(this._config);
		});
		ui.setGameConfig(this._config);
	}
	static description(config : GameConfigMessage) : string {
		switch (config.type()) {
		case GameMode.DUEL:
			return "Win the 1v1";
		case GameMode.FREE_FOR_ALL:
			return "Be the first to score " + config.getPoints() + (config.getPoints() > 1 ? " points" : " point");
		case GameMode.PRACTICE:
			return "Press " + KeyNames.kbd(settings.menuKeyCode) + " to exit";
		case GameMode.SURVIVAL:
			return "Be the last one standing";
		case GameMode.SPREE:
			return "Score " + config.getPoints() + (config.getPoints() > 1 ? " points" : " point") + " in a row";
		case GameMode.TEAM_BATTLE:
			return "Eliminate the enemy team";
		default:
			return "???";
		}
	}
	checkState(current : GameState) : [string, boolean] {
		switch (current) {
		case GameState.LOAD:
		case GameState.SETUP:
		case GameState.GAME:
			if (game.playerStates().numPlayers() < this._config.getPlayersMinOr(1)) {
				return ["Not enough players left in the game", false];
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
		case GameState.STARTING:
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
			if (game.clientDialogs().inSync(DialogType.LOADOUT)) {
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
							if (this._config.getStartingLoadout() !== LoadoutType.PICK || game.controller().gameState() !== GameState.GAME) {
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
				} else if (playerState.role() === PlayerRole.SPAWNING && playerState.timeInRole() > GameMaker._spawnTime) {
					// Force spawn after a certain time
					playerState.spawnPlayer();
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
						return tablet.getInfo(InfoType.ROUND_WINS) >= this._config.getVictories();
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
		if (!this.isSource()) {
			return;
		}

		switch (state) {
		case GameState.FREE:
			this._config.resetToDefault(GameMode.FREE);
			ui.setGameConfig(this._config);

			this._round = 0;
			this.setWinnerClientId(0);

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
			break;
		case GameState.STARTING:
	    	let startingMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	startingMsg.setAnnouncementType(AnnouncementType.GAME_STARTING);
	    	startingMsg.setNames([this._config.modeName()]);
	    	startingMsg.setTtl(this.timeLimit(GameState.STARTING) - 500);
	    	game.announcer().broadcast(startingMsg);
	    	break;
		case GameState.LOAD:
			this._round++;
			this.setWinnerClientId(0);

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
				type: this._config.getLevelType(),
				layout: this._config.getLevelLayout(),
				seed: this._config.getLevelSeed() + this._round,
				numPlayers: numPlayers,
				numTeams: numTeams,
			});

			const name = this._config.modeName() + " Round " + this._round;
			const description = GameMaker.description(this._config);
	    	let startGameMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	startGameMsg.setAnnouncementType(AnnouncementType.GENERIC);
	    	startGameMsg.setNames([name, description]);
	    	game.announcer().broadcast(startGameMsg);
			break;
		case GameState.SETUP:
			this.showSetupDialogs();
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
			this.queueForceSubmit(DialogType.LOADOUT);
			this._winners.forEach((clientId : number) => {
				if (game.tablets().hasTablet(clientId)) {
					game.tablet(clientId).addInfo(InfoType.ROUND_WINS, 1);
					game.tablet(clientId).setWinner(true);
				}
			});

	    	let winnerMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	winnerMsg.setAnnouncementType(AnnouncementType.GAME_FINISH);
	    	winnerMsg.setNames(this.winnerName());
	    	winnerMsg.setTtl(this.timeLimit(GameState.FINISH) - 1000);
	    	game.announcer().broadcast(winnerMsg);
			break;
		case GameState.VICTORY:
			this._winners.forEach((clientId : number) => {
				if (game.tablets().hasTablet(clientId)) {
					game.tablet(clientId).addInfo(InfoType.WINS, 1);
				}
			});
	    	let victorMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	victorMsg.setAnnouncementType(AnnouncementType.GAME_VICTORY);
	    	victorMsg.setNames(this.winnerName());
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

		if (this._config.getResetPoints()) {
			tablet.setInfo(InfoType.SCORE, 0);
		}

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

				if (this._config.getWinCondition() === WinConditionType.POINTS
					&& damagerTablet.getInfo(InfoType.SCORE) === this._config.getPoints() - 1) {
					let feed = new GameMessage(GameMessageType.FEED);
					feed.setFeedType(FeedType.ONE_MORE);
					feed.setNames([damagerTablet.displayName()]);
					game.announcer().broadcast(feed);
				}
			}
		}
	}

	private isPlaying(clientId : number) : boolean {
		return game.playerStates().hasPlayerState(clientId) && game.playerState(clientId).isPlaying();
	}

	private showSetupDialogs() : void {
		if (this._config.getStartingLoadout() === LoadoutType.RANDOM) {
			return;
		}

		if (this.mode() === GameMode.DUEL) {
			const nextId = this._playerRotator.nextFromAll();
			game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
				clientDialog.queueDialog(DialogType.LOADOUT);
			}, (clientDialog : ClientDialog) => {
				return clientDialog.clientId() === nextId;
			});
			return;
		}

		game.clientDialogs().executeIf<ClientDialog>((clientDialog : ClientDialog) => {
			clientDialog.queueDialog(DialogType.LOADOUT);
		}, (clientDialog : ClientDialog) => {
			return this.isPlaying(clientDialog.clientId());
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
			if (teams.size === 1) {
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

	private winnerName() : Array<string> {
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
}
