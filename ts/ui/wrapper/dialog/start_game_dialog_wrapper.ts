
import { game } from 'game'
import { GameMode } from 'game/api'
import { FrequencyType } from 'game/entity/api'
import { ConfigFactory } from 'game/factory/config_factory'
import { LoadoutType, PlayerRole, WinConditionType } from 'game/system/api'
import { Controller } from 'game/system/controller'
import { PlayerConfig, PlayerInfo } from 'game/util/player_config'

import { GameMessage, GameMessageType } from 'message/game_message'
import { GameConfigMessage } from 'message/game_config_message'

import { settings } from 'settings'

import { Strings } from 'strings'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'
import { KeyNames } from 'ui/common/key_names'

import { ButtonGroupWrapper } from 'ui/wrapper/button_group_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ModeSelectWrapper } from 'ui/wrapper/button/mode_select_wrapper'
import { ShareWrapper } from 'ui/wrapper/button/share_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ColumnWrapper } from 'ui/wrapper/column_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { ModeInfoWrapper } from 'ui/wrapper/mode_info_wrapper'
import { PlayerConfigWrapper } from 'ui/wrapper/player_config_wrapper'

type ModeOptions = {
	name : string;
	requirements : Array<string>;
	description : string;

	minRecommended? : number;
	maxRecommended? : number;
}

export class StartGameDialogWrapper extends DialogWrapper {

	private _mode : GameMode;
	private _currentMode : GameMode;
	private _modeButtons : ButtonGroupWrapper<ModeSelectWrapper>;
	private _infoWrappers : Map<GameMode, ModeInfoWrapper>;

	private _configMsg : GameConfigMessage;
	private _playerConfigWrapper : PlayerConfigWrapper;

	constructor() {
		super();

		this._mode = GameMode.UNKNOWN;
		this._currentMode = GameMode.UNKNOWN;
		this._modeButtons = new ButtonGroupWrapper();
		this._infoWrappers = new Map();

		this._configMsg = null;
		this._playerConfigWrapper = null;

		this.setTitle("Select a mode");
		this.addGameModePage();

		let shareWrapper = new ShareWrapper();
		shareWrapper.setText("Copy invite link");
		shareWrapper.setHoverOnlyText(true);
		shareWrapper.elm().style.float = "left";
		this.footerElm().appendChild(shareWrapper.elm());

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});

		let cancelButton = this.addCancelButton();
		cancelButton.addOnClick(() => {
			this.cancel();
		});

		this.addOnSubmit(() => {
			if (this._configMsg !== null && this._playerConfigWrapper !== null) {
				const config = this._playerConfigWrapper.config();
				const [errors, ok] = config.canPlay(this._configMsg);

				if (ok) {
					this._configMsg.setLevelSeed(Math.floor(10000 * Math.random()));
					game.controller().startGame(this._configMsg, config);
				} else {
					// Should never happen if page properly checks prior to submit
					console.error(errors.join(", "));
				}
			}
		});
	}

	override handleClientMessage(msg : GameMessage) : void {
		super.handleClientMessage(msg);

		this._modeButtons.buttons().forEach((button : ModeSelectWrapper) => {
			button.setNumPlayers(game.tablets().numSetup());
		});

		this._infoWrappers.forEach((wrapper : ModeInfoWrapper) => {
			wrapper.clearError();
		});

		if (this._playerConfigWrapper === null) {
			return;
		}

		if (msg.type() === GameMessageType.CLIENT_INITIALIZED) {
			this._playerConfigWrapper.addPlayer(msg.getClientId());
		} else if (msg.type() === GameMessageType.CLIENT_DISCONNECT) {
			this._playerConfigWrapper.deletePlayer(msg.getClientId());
		}
	}

	private addGameModePage() : void {
		let pageWrapper = this.addPage();

		let columnsWrapper = ColumnsWrapper.withWeights([3, 6]);

		let mode = columnsWrapper.column(0);
		mode.setLegend("Mode");
		mode.contentElm().style.fontSize = "0.7em";
		let info = columnsWrapper.column(1);
		info.setLegend("Description");
		info.contentElm().style.fontSize = "0.7em";

		this.addUnknownMode();
		this.populateMode(GameMode.DUEL, {
			name: "Duel",
			requirements: [],
			description: "1v1 your opponent on a small symmetric Birdtown.\r\n\r\nTake turns picking the loadout until someone wins.",
			minRecommended: 2,
			maxRecommended: 2,
		});
		this.populateMode(GameMode.FREE_FOR_ALL, {
			name: "Free for All",
			requirements: [],
			description: "Classic free for all.\r\n\r\nGain points by cooking other players and reach the score limit to win.",
			minRecommended: 3,
		});
		this.populateMode(GameMode.SUDDEN_DEATH, {
			name: "Lightning Round",
			requirements: [],
			description: "Be the last bird in a tiny town in a series of lightning quick rounds.",
			minRecommended: 2,
		});
		this.populateMode(GameMode.SPREE, {
			name: "Spree",
			requirements: [],
			description: "Free for all, but lose all of your points on death.",
			minRecommended: 3,
		});
		this.populateMode(GameMode.SURVIVAL, {
			name: "Survival",
			requirements: [],
			description: "Be the last bird in town.",
			minRecommended: 3,
		});
		this.populateMode(GameMode.TEAM_BATTLE, {
			name: "Team Battle",
			requirements: [],
			description: "Everyone has one life--eliminate the enemy team while reviving your teammates.",
			minRecommended: 4,
		});
		this.populateMode(GameMode.PRACTICE, {
			name: "Practice Mode",
			requirements: [],
			description: "Try out the game.",
			minRecommended: 1,
			maxRecommended: 1,
		});

		mode.contentElm().appendChild(this._modeButtons.elm());
		this._infoWrappers.forEach((wrapper : ModeInfoWrapper, mode : GameMode) => {
			if (mode === GameMode.UNKNOWN) {
				wrapper.show();
			} else {
				wrapper.hide();
			}
			info.contentElm().appendChild(wrapper.elm());
		});

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setCanSubmit(() => {
			const mode = this.getMode();
			const [startErrors, canStart] = Controller.canStart(mode);
			if (!canStart) {
				this._infoWrappers.get(mode).setErrors(startErrors);
			}
			return canStart;
		});

		pageWrapper.setOnSubmit(() => {
			const mode = this.getMode();
			if (mode === GameMode.UNKNOWN) {
				this.cancel();
			} else {
				this.addModePage(mode);
			}
		});
	}

	private addUnknownMode() : void {
		let infoWrapper = new ModeInfoWrapper();
		infoWrapper.setDescription("Select a game mode on the left.");
		infoWrapper.setRequirements(["Most modes require at least 2 players", Icon.string(IconType.STAR) + " is recommended for your group size"]);
		this._infoWrappers.set(GameMode.UNKNOWN, infoWrapper);
	}
	private populateMode(mode : GameMode, options : ModeOptions) : void {
		let buttonWrapper = this._modeButtons.addButton(new ModeSelectWrapper());
		buttonWrapper.elm().style.width = "100%";
		buttonWrapper.setText(" " + options.name);
		buttonWrapper.addOnMouseEnter(() => {
			this.previewMode(mode);
		});
		buttonWrapper.addOnClick(() => {
			this.stickMode(mode);
		});
		
		let requirements = [];
		const config = ConfigFactory.loadRef(mode);
		if (config.hasPlayersMin()) {
			buttonWrapper.setMinPlayers(config.getPlayersMin());
		}
		if (config.hasPlayersMax()) {
			buttonWrapper.setMaxPlayers(config.getPlayersMax());
		}
		let playerRange = this.rangeToString(config.getPlayersMinOr(0), config.getPlayersMaxOr(0));
		if (playerRange.length > 0) {
			requirements.push(playerRange + " players required");
		}

		if (options.minRecommended) {
			buttonWrapper.setMinRecommended(options.minRecommended);
		}
		if (options.maxRecommended) {
			buttonWrapper.setMaxRecommended(options.maxRecommended);
		}
		let recommendedRange = this.rangeToString(options.minRecommended, options.maxRecommended);
		if (recommendedRange.length > 0 && playerRange !== recommendedRange) {
			requirements.push(recommendedRange + " players recommended");
		}

		buttonWrapper.setNumPlayers(game.tablets().numSetup());

		let infoWrapper = new ModeInfoWrapper();
		infoWrapper.setDescription(options.description);
		requirements.push(...options.requirements);
		infoWrapper.setRequirements(requirements);

		this._infoWrappers.set(mode, infoWrapper);
	}
	private rangeToString(min : number, max : number) : string {
		if (!min && !max) {
			return "";
		}
		if (min > 1 && !max) {
			return min + "+";
		}
		if (min > 1 && min === max) {
			return min + "";
		}
		if (!min && max > 1) {
			return "Up to " + max;
		}
		if (min > 0 && max > min) {
			return min + "-" + max;
		}
		return "";
	}

	private previewMode(mode : GameMode) : void {
		if (this._mode !== GameMode.UNKNOWN) {
			return;
		}
		this.showMode(mode);
	}
	private stickMode(mode : GameMode) : void {
		this._mode = mode;
		this.showMode(mode);
	}
	private getMode() : GameMode { return this._mode === GameMode.UNKNOWN ? this._currentMode : this._mode; }
	private showMode(mode : GameMode) : void {
		this._infoWrappers.forEach((wrapper : ModeInfoWrapper, wrapperMode : GameMode) => {
			if (mode === wrapperMode) {
				wrapper.show();
			} else {
				wrapper.hide();
			}
		});
		this._currentMode = mode;
	}

	private addModePage(mode : GameMode) : void {
		if (mode === GameMode.UNKNOWN) {
			console.error("Error: cannot make mode page for unknown mode");
			this.cancel();
		}
		this._configMsg = ConfigFactory.load(mode);

		let pageWrapper = this.addPage();
		this.setTitle(this._configMsg.modeName());
		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);

		let options = columnsWrapper.column(0);
		options.setLegend("Options");
		options.contentElm().style.fontSize = "0.7em";
		options.contentElm().style.textAlign = "center";
		options.contentElm().textContent = "Customize game mode options\r\n\r\n"

		const teamMode = this._configMsg.getWinCondition() === WinConditionType.TEAM_LIVES || this._configMsg.getWinCondition() === WinConditionType.TEAM_POINTS;

		switch (mode) {
		case GameMode.DUEL:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.FREE_FOR_ALL:
		case GameMode.SPREE:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.pointsWrapper(this._configMsg, 1, 15).elm());
			options.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			options.contentElm().appendChild(this.loadoutWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.PRACTICE:
			options.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.SUDDEN_DEATH:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.livesWrapper(this._configMsg, 1, 5).elm());	
			options.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			options.contentElm().appendChild(this.loadoutWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.SURVIVAL:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.livesWrapper(this._configMsg, 1, 5).elm());
			options.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			options.contentElm().appendChild(this.loadoutWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.TEAM_BATTLE:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			options.contentElm().appendChild(this.loadoutWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		}

		let players = columnsWrapper.column(1);
		players.setLegend("Players");
		players.contentElm().style.textAlign = "center";
		players.contentElm().style.fontSize = "0.7em";

		this._playerConfigWrapper = new PlayerConfigWrapper();
		players.contentElm().appendChild(this._playerConfigWrapper.elm());

		if (teamMode) {
			this._playerConfigWrapper.setInfo("Customize team assignments and spectators");
			this._playerConfigWrapper.setTeams(true, this._configMsg.getPlayersMaxOr(0));

			if (this._configMsg.hasPlayersMax()) {
				this._playerConfigWrapper.addRandomButton(this._configMsg.getPlayersMax());
			} else {
				this._playerConfigWrapper.addRandomButton();
			}
		} else {
			this._playerConfigWrapper.setInfo("Customize players and spectators");
		}

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setCanSubmit(() => {
			return this._playerConfigWrapper.checkCanPlay(this._configMsg);
		});
	}

	private pointsWrapper(msg : GameConfigMessage, min : number, max : number) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Score limit",
			value: msg.getPoints(),
			plus: (current : number) => {
				msg.setPoints(Math.min(current + 1, max));
			},
			minus: (current : number) => {
				msg.setPoints(Math.max(min, current - 1));
			},
			get: () => { return msg.getPoints(); },
			html: (current : number) => {
				return current + " point" + (current === 1 ? "" : "s");
			},
		});
	}
	private resetPointsWrapper(msg : GameConfigMessage) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Reset points on death",
			value: Number(msg.getResetPoints()),
			plus: (current : number) => {
				current = current !== 0 ? 0 : 1;
				msg.setResetPoints(current === 1);
			},
			minus: (current : number) => {
				current = current !== 0 ? 0 : 1;
				msg.setResetPoints(current === 1);
			},
			get: () => { return Number(msg.getResetPoints()); },
			html: (current : number) => {
				return msg.getResetPoints() ? "On" : "Off";
			},
		});
	}
	private livesWrapper(msg : GameConfigMessage, min : number, max : number) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Lives",
			value: msg.getLives(),
			plus: (current : number) => {
				msg.setLives(Math.min(current + 1, max));
			},
			minus: (current : number) => {
				msg.setLives(Math.max(min, current - 1));
			},
			get: () => { return msg.getLives(); },
		});
	}
	private victoriesWrapper(msg : GameConfigMessage, min : number, max : number) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "First to",
			value: msg.getVictories(),
			plus: (current : number) => {
				msg.setVictories(Math.min(current + 1, max));
			},
			minus: (current : number) => {
				msg.setVictories(Math.max(min, current - 1));
			},
			get: () => { return msg.getVictories(); },
			html: (current : number) => {
				return current + " win" + (current === 1 ? "" : "s");
			},
		});
	}
	private damageMultiplierWrapper(msg : GameConfigMessage, min : number, max : number) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Damage Multiplier",
			value: msg.getDamageMultiplierOr(1),
			plus: (current : number) => {
				msg.setDamageMultiplier(Math.min(current + 0.5, max));
			},
			minus: (current : number) => {
				msg.setDamageMultiplier(Math.max(min, current - 0.5));
			},
			get: () => { return msg.getDamageMultiplierOr(1); },
			html: (current : number) => {
				return current.toFixed(1) + "x";
			}
		});
	}
	private loadoutWrapper(msg : GameConfigMessage) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Starting Loadout",
			value: Number(msg.getStartingLoadout()),
			plus: (current : number) => {
				if (current === LoadoutType.PICK) {
					msg.setStartingLoadout(LoadoutType.RANDOM);
				} else {
					msg.setStartingLoadout(LoadoutType.PICK);
				}
			},
			minus: (current : number) => {
				if (current === LoadoutType.PICK) {
					msg.setStartingLoadout(LoadoutType.RANDOM);
				} else {
					msg.setStartingLoadout(LoadoutType.PICK);
				}
			},
			get: () => { return msg.getStartingLoadout(); },
			html: (current : number) => {
				switch (current) {
				case LoadoutType.PICK:
					return "Pick";
				case LoadoutType.RANDOM:
					return "Random";
				default:
					return "???";
				}
			},
		});
	}
	private healthCrateWrapper(msg : GameConfigMessage) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Health crate drop rate",
			value: Number(msg.getHealthCrateSpawn()),
			plus: (current : number) => {
				if (current === FrequencyType.UBIQUITOUS) {
					return;
				}
				current++;
				msg.setHealthCrateSpawn(current);
			},
			minus: (current : number) => {
				if (current === FrequencyType.NEVER) {
					return;
				}
				current--;
				msg.setHealthCrateSpawn(current);
			},
			get: () => { return msg.getHealthCrateSpawn(); },
			html: (current : number) => { return Strings.toTitleCase(FrequencyType[current]); },
		});
	}
	private weaponCrateWrapper(msg : GameConfigMessage) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Weapon crate drop rate",
			value: Number(msg.getWeaponCrateSpawn()),
			plus: (current : number) => {
				if (current === FrequencyType.UBIQUITOUS) {
					return;
				}
				current++;
				msg.setWeaponCrateSpawn(current);
			},
			minus: (current : number) => {
				if (current === FrequencyType.NEVER) {
					return;
				}
				current--;
				msg.setWeaponCrateSpawn(current);
			},
			get: () => { return msg.getWeaponCrateSpawn(); },
			html: (current : number) => { return Strings.toTitleCase(FrequencyType[current]); },
		});
	}

}