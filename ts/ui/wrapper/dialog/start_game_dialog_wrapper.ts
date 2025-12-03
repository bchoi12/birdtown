
import { game } from 'game'
import { GameMode } from 'game/api'
import { FrequencyType } from 'game/entity/api'
import { ConfigFactory } from 'game/factory/config_factory'
import { LevelType, LevelLayout, LoadoutType, PlayerRole, WeaponSetType, WinConditionType } from 'game/system/api'
import { Controller } from 'game/system/controller'
import { PlayerConfig, PlayerInfo, TeamMode } from 'game/util/player_config'

import { GameMessage, GameMessageType } from 'message/game_message'
import { GameConfigMessage } from 'message/game_config_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { settings } from 'settings'

import { Strings } from 'strings'
import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { AnnouncementType, ChatType, DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'
import { KeyNames } from 'ui/common/key_names'

import { ButtonGroupWrapper } from 'ui/wrapper/button_group_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ModeSelectWrapper } from 'ui/wrapper/button/mode_select_wrapper'
import { ShareWrapper } from 'ui/wrapper/button/share_wrapper'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ColumnWrapper } from 'ui/wrapper/column_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { ModeInfoWrapper } from 'ui/wrapper/mode_info_wrapper'
import { PlayerConfigWrapper } from 'ui/wrapper/player_config_wrapper'

type ModeOptions = {
	requirements : Array<string>;
	description : string;
	parent : HTMLElement;

	minRecommended? : number;
	maxRecommended? : number;
}

enum PageType {
	UNKNOWN,

	SELECT_MODE,
	CONFIGURE,
}

export class StartGameDialogWrapper extends DialogWrapper {

	private static readonly _fontSize = "0.7em";

	private _currentPage : PageType;
	private _mode : GameMode;
	private _currentMode : GameMode;
	private _modeButtons : ButtonGroupWrapper<ModeSelectWrapper>;
	private _descriptionCategory : CategoryWrapper;
	private _infoWrappers : Map<GameMode, ModeInfoWrapper>;

	private _configMsg : GameConfigMessage;
	private _playerConfigWrapper : PlayerConfigWrapper;

	constructor() {
		super();

		this._currentPage = PageType.UNKNOWN;
		this._mode = GameMode.UNKNOWN;
		this._currentMode = GameMode.UNKNOWN;
		this._modeButtons = new ButtonGroupWrapper();
		this._descriptionCategory = new CategoryWrapper();
		this._descriptionCategory.setTitle("Description");
		this._descriptionCategory.setAlwaysExpand(true);
		this._infoWrappers = new Map();

		this._configMsg = null;
		this._playerConfigWrapper = null;

		this.addGameModePage();

		let shareWrapper = new ShareWrapper();
		shareWrapper.configureForDialog();
		this.footerElm().appendChild(shareWrapper.elm());

		let okButton = this.addOKButton(game.isHost() ? "OK" : "Ask to Play");
		okButton.addOnClick(() => {
			this.nextPage();
		});

		let cancelButton = this.addCancelButton();
		cancelButton.addOnClick(() => {
			if (this._currentPage === PageType.CONFIGURE) {
				this.previousPage();
				return;
			}
			this.cancel();
		});

		this.addOnSubmit(() => {
			if (!game.isHost()) {
				const mode = this.getMode();
				if (mode === GameMode.UNKNOWN) {
					return;
				}

				let requestMsg = new NetworkMessage(NetworkMessageType.CHAT);
				requestMsg.setGameMode(mode)
				game.netcode().sendMessage(requestMsg);
				return;
			}

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
		this._currentPage = PageType.SELECT_MODE;

		let pageWrapper = this.addPage("Select Mode");

		let columnsWrapper = ColumnsWrapper.withWeights([4, 6]);

		let modeColumn = columnsWrapper.column(0);
		modeColumn.contentElm().style.fontSize = StartGameDialogWrapper._fontSize;

		let classicCategory = new CategoryWrapper();
		classicCategory.setTitle("Free for All");

		let teamCategory = new CategoryWrapper();
		teamCategory.setTitle("Team");

		modeColumn.contentElm().appendChild(classicCategory.elm());
		modeColumn.contentElm().appendChild(teamCategory.elm());

		let infoColumn = columnsWrapper.column(1);
		infoColumn.contentElm().style.fontSize = StartGameDialogWrapper._fontSize;
		infoColumn.contentElm().appendChild(this._descriptionCategory.elm());

		this.addUnknownMode();
		this.populateMode(GameMode.PRACTICE, {
			requirements: [],
			description: "Try out the game.\r\n\r\nAll levels, layouts, and equip combos are allowed.",
			parent: classicCategory.contentElm(),
		});
		/*
		this.populateMode(GameMode.INVASION, {
			requirements: [],
			description: "Defend Birdtown against an invasion using teamwork and unique buffs.\r\n\r\nDifficulty scales with number of players.",
			parent: teamCategory.contentElm(),
			minRecommended: 1,
			maxRecommended: 4,
		});
		*/
		this.populateMode(GameMode.FREE_FOR_ALL, {
			requirements: [],
			description: "Classic free for all.\r\n\r\nGain points by cooking other players and reach the score limit to win.",
			parent: classicCategory.contentElm(),
			minRecommended: 3,
		});
		this.populateMode(GameMode.GOLDEN_GUN, {
			requirements: [],
			description: "Free for all, but with a twist.\r\n\r\nCook any other player to upgrade your weapon to the Golden Gun. You can only score points after upgrading.",
			parent: classicCategory.contentElm(),
			minRecommended: 3,
		});
		this.populateMode(GameMode.SUDDEN_DEATH, {
			requirements: [],
			description: "Be the last bird in a tiny level in a series of lightning quick rounds.",
			parent: classicCategory.contentElm(),
			minRecommended: 3,
		});
		this.populateMode(GameMode.SPREE, {
			requirements: [],
			description: "Free for all, but lose all of your points on death.\r\n\r\nBecome faster, stronger, and more 'glass cannon' as your spree grows.",
			parent: classicCategory.contentElm(),
			minRecommended: 3,
			maxRecommended: 8,
		});
		this.populateMode(GameMode.SURVIVAL, {
			requirements: [],
			description: "Be the last bird in town.\r\n\r\nRecommended for larger groups along with the 'Endless' level modifier.",
			parent: classicCategory.contentElm(),
			minRecommended: 4,
		});
		this.populateMode(GameMode.DUEL, {
			requirements: [],
			description: "Tryhard mode.\r\n\r\nOutsweat your opponent on a small symmetrical level where everyone gets the same loadout.",
			parent: teamCategory.contentElm(),
			minRecommended: 2,
			maxRecommended: 4,
		});
		this.populateMode(GameMode.TEAM_BATTLE, {
			requirements: [],
			description: "Everyone has one life. Both teams start on either end of the level.\r\n\r\nEliminate the enemy team while reviving your teammates.",
			parent: teamCategory.contentElm(),
			minRecommended: 4,
		});
		this.populateMode(GameMode.BUFF_BATTLE, {
			requirements: [],
			description: "Team Battle, but with buffs after each round.\r\n\r\nThe winning team gets one buff and the losing team gets two buffs. Unlike Team Battle, this game mode works great for smaller groups too.",
			parent: teamCategory.contentElm(),
			minRecommended: 2,
		});
		/*
		this.populateMode(GameMode.TEAM_DEATHMATCH, {
			requirements: [],
			description: "Chaotic team based deathmatch. Drop in from the sky and fight with your team.\r\n\r\nReach the score limit with your team to win.",
			parent: teamCategory.contentElm(),
			minRecommended: 4,
		});
		*/
		this.populateMode(GameMode.VIP, {
			requirements: [],
			description: "Like Team Battle, but each team has a VIP with a Golden Gun.\r\n\r\nEliminate the other team's VIP and protect yours at all costs.",
			parent: teamCategory.contentElm(),
			minRecommended: 4,
		});

		this._infoWrappers.forEach((wrapper : ModeInfoWrapper, mode : GameMode) => {
			if (this._mode === mode) {
				wrapper.show();
			} else {
				wrapper.hide();
			}
			this._descriptionCategory.contentElm().appendChild(wrapper.elm());
		});

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setCanSubmit(() => {
			if (!game.isHost()) {
				return true;
			}

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
				return;
			}

			if (game.isHost()) {
				game.netcode().sendChat(ChatType.INFORM, `is setting up ${StringFactory.getModeName(mode)}`);
				this.addConfigurePage(mode);
			}
		});

	if (game.isHost()) {
			game.netcode().sendChat(ChatType.INFORM, "is selecting a game mode...");
		}
	}

	private addUnknownMode() : void {
		let infoWrapper = new ModeInfoWrapper();
		infoWrapper.setDescription("Select a game mode on the left.");
		infoWrapper.setRequirements(["Most modes require at least 2 players", Icon.string(IconType.STAR) + " is recommended for your group size"]);
		this._infoWrappers.set(GameMode.UNKNOWN, infoWrapper);
	}
	private populateMode(mode : GameMode, options : ModeOptions) : void {
		let buttonWrapper = this._modeButtons.addButton(new ModeSelectWrapper());
		buttonWrapper.setText(" " + StringFactory.getModeName(mode));
		buttonWrapper.addOnMouseEnter(() => {
			this.previewMode(mode);
		});
		buttonWrapper.addOnClick(() => {
			this.stickMode(mode);
		});

		options.parent.appendChild(buttonWrapper.elm());
		
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
		if (recommendedRange.length > 0) {
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
		this._descriptionCategory.setTitle(StringFactory.getModeName(mode));
	}

	private addConfigurePage(mode : GameMode) : void {
		if (mode === GameMode.UNKNOWN) {
			console.error("Error: cannot make mode page for unknown mode");
			this.cancel();
			return;
		}

		this._currentPage = PageType.CONFIGURE;

		this._configMsg = ConfigFactory.load(mode);

		let pageWrapper = this.addPage(this._configMsg.modeName());
		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);

		let options = columnsWrapper.column(0);
		options.contentElm().style.fontSize = StartGameDialogWrapper._fontSize;

		let coreCategory = new CategoryWrapper();
		coreCategory.setTitle(`${this._configMsg.modeName()} Options`);
		coreCategory.setAlwaysExpand(true);
		options.contentElm().appendChild(coreCategory.elm());

		options.contentElm().appendChild(Html.br());

		let otherCategory = new CategoryWrapper();
		otherCategory.setTitle("More Options");
		otherCategory.setExpanded(true);
		options.contentElm().appendChild(otherCategory.elm());

		let teamMode = TeamMode.FREE_FOR_ALL;
		if (this._configMsg.getWinCondition() === WinConditionType.TEAM_LIVES || this._configMsg.getWinCondition() === WinConditionType.TEAM_POINTS) {
			teamMode = TeamMode.TWO_TEAMS;
		} else if (this._configMsg.getWinCondition() === WinConditionType.BOSS) {
			teamMode = TeamMode.COOP;
		}

		switch (mode) {
		case GameMode.DUEL:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.MIRROR, LevelLayout.TINY]).elm());
			coreCategory.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE_TURNS, LoadoutType.PICK_TURNS, LoadoutType.RANDOM_ALL, LoadoutType.GOLDEN_GUN]).elm());
			otherCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponSetWrapper(this._configMsg).elm());
			break;
		case GameMode.FREE_FOR_ALL:
		case GameMode.GOLDEN_GUN:
		case GameMode.SPREE:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());

			if (mode === GameMode.GOLDEN_GUN) {
				coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE, LoadoutType.PICK, LoadoutType.RANDOM]).elm());
			} else {
				coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE, LoadoutType.PICK, LoadoutType.RANDOM, LoadoutType.GOLDEN_GUN]).elm());
			}
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.NORMAL, LevelLayout.CIRCLE, LevelLayout.TINY, LevelLayout.MIRROR]).elm());
			coreCategory.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			coreCategory.contentElm().appendChild(this.pointsWrapper(this._configMsg, 1, 15).elm());
			otherCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponSetWrapper(this._configMsg).elm());
			break;
		case GameMode.INVASION:
			// TODO: difficulty setting
			break;
		case GameMode.PRACTICE:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.NORMAL, LevelLayout.CIRCLE, LevelLayout.TINY, LevelLayout.MIRROR]).elm());
			coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE, LoadoutType.PICK, LoadoutType.RANDOM]).elm());
			coreCategory.contentElm().appendChild(this.weaponSetWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.SUDDEN_DEATH:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.NORMAL, LevelLayout.CIRCLE, LevelLayout.TINY, LevelLayout.MIRROR]).elm());
			coreCategory.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			coreCategory.contentElm().appendChild(this.livesWrapper(this._configMsg, 1, 5).elm());	
			coreCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE, LoadoutType.PICK, LoadoutType.RANDOM]).elm());
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponSetWrapper(this._configMsg).elm());
			break;
		case GameMode.SURVIVAL:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.NORMAL, LevelLayout.CIRCLE, LevelLayout.TINY, LevelLayout.MIRROR]).elm());
			coreCategory.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			coreCategory.contentElm().appendChild(this.livesWrapper(this._configMsg, 1, 5).elm());
			coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE, LoadoutType.PICK, LoadoutType.RANDOM]).elm());
			otherCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponSetWrapper(this._configMsg).elm());
			break;
		case GameMode.TEAM_BATTLE:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.NORMAL, LevelLayout.TINY, LevelLayout.MIRROR]).elm());
			coreCategory.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE, LoadoutType.PICK, LoadoutType.RANDOM, LoadoutType.GOLDEN_GUN]).elm());
			coreCategory.contentElm().appendChild(this.friendlyFireWrapper(this._configMsg).elm());						
			otherCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponSetWrapper(this._configMsg).elm());
			break
		case GameMode.BUFF_BATTLE:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.NORMAL, LevelLayout.TINY, LevelLayout.MIRROR]).elm());
			coreCategory.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 20).elm());
			otherCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.VIP:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.NORMAL, LevelLayout.TINY, LevelLayout.MIRROR]).elm());
			coreCategory.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE, LoadoutType.PICK, LoadoutType.RANDOM]).elm());
			coreCategory.contentElm().appendChild(this.friendlyFireWrapper(this._configMsg).elm());						
			otherCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponSetWrapper(this._configMsg).elm());
			break;
		case GameMode.TEAM_DEATHMATCH:
			coreCategory.contentElm().appendChild(this.levelWrapper(this._configMsg).elm());
			coreCategory.contentElm().appendChild(this.layoutWrapper(this._configMsg, [LevelLayout.NORMAL, LevelLayout.CIRCLE, LevelLayout.TINY, LevelLayout.MIRROR]).elm());
			coreCategory.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			coreCategory.contentElm().appendChild(this.pointsWrapper(this._configMsg, 1, 30).elm());
			coreCategory.contentElm().appendChild(this.loadoutWrapper(this._configMsg, [LoadoutType.CHOOSE, LoadoutType.PICK, LoadoutType.RANDOM, LoadoutType.GOLDEN_GUN]).elm());
			coreCategory.contentElm().appendChild(this.friendlyFireWrapper(this._configMsg).elm());						
			otherCategory.contentElm().appendChild(this.damageMultiplierWrapper(this._configMsg, 1, 10).elm());						
			otherCategory.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			otherCategory.contentElm().appendChild(this.weaponSetWrapper(this._configMsg).elm());
			break;
		}

		let players = columnsWrapper.column(1);
		players.contentElm().style.fontSize = StartGameDialogWrapper._fontSize;

		let playerCategory = new CategoryWrapper();
		playerCategory.setTitle("Player Setup");
		playerCategory.setAlwaysExpand(true);
		players.contentElm().appendChild(playerCategory.elm());

		this._playerConfigWrapper = new PlayerConfigWrapper();
		playerCategory.contentElm().appendChild(this._playerConfigWrapper.elm());

		if (this._configMsg.hasPlayersMax()) {
			this._playerConfigWrapper.setTeamMode(teamMode, this._configMsg.getPlayersMax());
		} else {
			this._playerConfigWrapper.setTeamMode(teamMode);
		}

		if (teamMode === TeamMode.TWO_TEAMS) {
			if (this._configMsg.hasPlayersMax()) {
				this._playerConfigWrapper.addRandomButton(this._configMsg.getPlayersMax());
			} else {
				this._playerConfigWrapper.addRandomButton();
			}
		}

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setCanSubmit(() => {
			return this._playerConfigWrapper.checkCanPlay(this._configMsg);
		});
	}

	private levelWrapper(msg : GameConfigMessage) : LabelNumberWrapper {
		const types = [LevelType.RANDOM, LevelType.BIRDTOWN, LevelType.CLIFF_LAKE];

		let index = types.indexOf(msg.getLevelType());
		if (index < 0) {
			msg.setLevelType(types[0]);
			index = 0;
		}

		return new LabelNumberWrapper({
			label: "Level",
			value: msg.getLevelType(),
			plus: (current : number) => {
				index++;
				if (index >= types.length) {
					index = 0;
				}
				msg.setLevelType(types[index]);
			},
			minus: (current : number) => {
				index--;
				if (index < 0) {
					index = types.length - 1;
				}
				msg.setLevelType(types[index]);
			},
			get: () => { return msg.getLevelType(); },
			html: (current : number) => {
				return StringFactory.getLevelName(current);
			},
		});
	}
	private layoutWrapper(msg : GameConfigMessage, types : LevelLayout[]) : LabelNumberWrapper {
		let index = types.indexOf(msg.getLevelLayout());
		if (index < 0) {
			msg.setLevelLayout(types[0]);
			index = 0;
		}

		return new LabelNumberWrapper({
			label: "Level modifier",
			value: msg.getLevelLayout(),
			plus: (current : number) => {
				index++;
				if (index >= types.length) {
					index = 0;
				}
				msg.setLevelLayout(types[index]);
			},
			minus: (current : number) => {
				index--;
				if (index < 0) {
					index = types.length - 1;
				}
				msg.setLevelLayout(types[index]);
			},
			get: () => { return msg.getLevelLayout(); },
			html: (current : number) => {
				return StringFactory.getLayoutName(current);
			},
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
			label: "Game length",
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
			label: "Damage multiplier",
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
	private friendlyFireWrapper(msg : GameConfigMessage) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Friendly Fire",
			value: Number(msg.getFriendlyFire()),
			plus: (current : number) => {
				current = current !== 0 ? 0 : 1;
				msg.setFriendlyFire(current === 1);
			},
			minus: (current : number) => {
				current = current !== 0 ? 0 : 1;
				msg.setFriendlyFire(current === 1);
			},
			get: () => { return Number(msg.getFriendlyFire()); },
			html: (current : number) => {
				return msg.getFriendlyFire() ? "On" : "Off";
			},
		});
	}

	private loadoutWrapper(msg : GameConfigMessage, types : LoadoutType[]) : LabelNumberWrapper {
		let index = types.indexOf(msg.getStartingLoadout());
		if (index < 0) {
			msg.setStartingLoadout(types[0]);
			index = 0;
		}

		return new LabelNumberWrapper({
			label: "Starting loadout",
			value: msg.getStartingLoadout(),
			plus: (current : number) => {
				index++;
				if (index >= types.length) {
					index = 0;
				}
				msg.setStartingLoadout(types[index]);
			},
			minus: (current : number) => {
				index--;
				if (index < 0) {
					index = types.length - 1;
				}
				msg.setStartingLoadout(types[index]);
			},
			get: () => { return msg.getStartingLoadout(); },
			html: (current : number) => { return StringFactory.getLoadoutName(current); },
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

	private weaponSetWrapper(msg : GameConfigMessage) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Weapon crate set",
			value: Number(msg.getWeaponSet()),
			plus: (current : number) => {
				if (current === WeaponSetType.ALL) {
					current = WeaponSetType.RECOMMENDED;
				} else {
					current++;
				}
				msg.setWeaponSet(current);
			},
			minus: (current : number) => {
				if (current === WeaponSetType.RECOMMENDED) {
					current = WeaponSetType.ALL;
				} else {
					current--;
				}
				msg.setWeaponSet(current);
			},
			get: () => { return msg.getWeaponSet(); },
			html: (current : number) => { 
				switch (current) {
				case WeaponSetType.RECOMMENDED:
					return "Recommended only";
				case WeaponSetType.ALL:
					return "All equips";
				}
				return Strings.toTitleCase(FrequencyType[current]);
			},
		});
	}

}