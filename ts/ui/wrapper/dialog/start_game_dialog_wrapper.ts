
import { game } from 'game'
import { GameMode } from 'game/api'
import { FrequencyType } from 'game/entity/api'
import { ConfigFactory } from 'game/factory/config_factory'
import { PlayerRole, WinConditionType } from 'game/system/api'
import { Controller } from 'game/system/controller'
import { PlayerConfig, PlayerInfo } from 'game/util/player_config'

import { GameMessage, GameMessageType } from 'message/game_message'
import { GameConfigMessage } from 'message/game_config_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { KeyNames } from 'ui/common/key_names'

import { ButtonGroupWrapper } from 'ui/wrapper/button_group_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { GameModeInfoWrapper } from 'ui/wrapper/game_mode_info_wrapper'
import { PlayerConfigWrapper } from 'ui/wrapper/player_config_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ColumnWrapper } from 'ui/wrapper/column_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'

export class StartGameDialogWrapper extends DialogWrapper {

	private _mode : GameMode;
	private _configMsg : GameConfigMessage;
	private _playerConfigWrapper : PlayerConfigWrapper;

	constructor() {
		super();

		this._mode = GameMode.UNKNOWN;
		this._configMsg = null;
		this._playerConfigWrapper = null;

		this.setTitle("Select a mode");
		this.addGameModePage();

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

		let infoWrapper = new GameModeInfoWrapper();
		infoWrapper.setDescription("Select a game mode on the left.");
		info.contentElm().appendChild(infoWrapper.elm());

		let modeButtons = new ButtonGroupWrapper();

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Duel");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.DUEL;

				infoWrapper.setRequirements(["2+ players required", "Even teams recommended"]);
				infoWrapper.setDescription(
					"Duel your opponents in standardized pseudo-random maps where you take turns picking the loadout.");
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Free for all");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.FREE_FOR_ALL;

				infoWrapper.setRequirements(["2+ players required", "3+ players recommended"]);
				infoWrapper.setDescription(
					"It's everyone for themselves.\r\n\r\nScore points by cooking other players. " +
					"Win by reaching the score limit or having the most points when time runs out.");
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Survival");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.SURVIVAL;

				infoWrapper.setRequirements(["2+ players required", "3+ players recommended"]);
				infoWrapper.setDescription(
					"Be the last bird in town.\r\n\r\n" + 
					"Each player starts with the same number of lives. " +
					"The last player standing wins the round. If time runs out, it's a draw.");
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Team Battle");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.TEAM_BATTLE;

				infoWrapper.setRequirements(["2+ players required", "4+ players recommended"]);
				infoWrapper.setDescription(
					"Eliminate the enemy team.\r\n\r\n" + 
					"Each player only has one life, but you can revive your teammates.");
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Practice Mode");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.PRACTICE;

				infoWrapper.setRequirements(["There are no rules"]);
				infoWrapper.setDescription("Practice whatever you want with whoever you want.");
			});
		}

		mode.contentElm().appendChild(modeButtons.elm());
		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setCanSubmit(() => {
			const [startErrors, canStart] = Controller.canStart(this._mode);
			if (!canStart) {
				infoWrapper.setErrors(startErrors);
			}
			return canStart;
		});

		pageWrapper.setOnSubmit(() => {
			if (this._mode === GameMode.UNKNOWN) {
				this.cancel();
			} else {
				this.addModePage(this._mode);
			}
		});
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
		options.contentElm().style.fontSize = "0.6em";
		options.contentElm().style.textAlign = "center";
		options.contentElm().textContent = "Update game options below\r\n\r\n"

		const teamMode = this._configMsg.getWinCondition() === WinConditionType.TEAM_LIVES || this._configMsg.getWinCondition() === WinConditionType.TEAM_POINTS;

		switch (mode) {
		case GameMode.DUEL:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.FREE_FOR_ALL:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.pointsWrapper(this._configMsg, 1, 15).elm());			
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.PRACTICE:
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.SURVIVAL:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.livesWrapper(this._configMsg, 1, 5).elm());			
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		case GameMode.TEAM_BATTLE:
			options.contentElm().appendChild(this.victoriesWrapper(this._configMsg, 1, 10).elm());
			options.contentElm().appendChild(this.healthCrateWrapper(this._configMsg).elm());
			options.contentElm().appendChild(this.weaponCrateWrapper(this._configMsg).elm());
			break;
		}

		let players = columnsWrapper.column(1);
		players.setLegend("Players");
		players.contentElm().style.fontSize = "0.6em";

		this._playerConfigWrapper = new PlayerConfigWrapper();
		players.contentElm().appendChild(this._playerConfigWrapper.elm());

		if (teamMode) {
			this._playerConfigWrapper.setInfo("Click to update team assignments and spectators");
			this._playerConfigWrapper.setTeams(true);
		} else {
			this._playerConfigWrapper.setInfo("Click to assign players and spectators");
		}

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setCanSubmit(() => {
			return this._playerConfigWrapper.checkCanPlay(this._configMsg);
		});
	}

	private pointsWrapper(msg : GameConfigMessage, min : number, max : number) : LabelNumberWrapper {
		return new LabelNumberWrapper({
			label: "Points for a win",
			value: msg.getPoints(),
			plus: (current : number) => {
				msg.setPoints(Math.min(current + 1, max));
			},
			minus: (current : number) => {
				msg.setPoints(Math.max(min, current - 1));
			},
			get: () => { return msg.getPoints(); },
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
	private healthCrateWrapper(msg : GameConfigMessage) : SettingWrapper<FrequencyType> {
		return new SettingWrapper<FrequencyType>({
			name: "Health Crate Spawn Rate",
			value: msg.getHealthCrateSpawn(),
			click: (current : FrequencyType) => {
				if (current === FrequencyType.HIGH) {
					current = FrequencyType.NEVER;
				} else {
					current++;
				}
				msg.setHealthCrateSpawn(current);
				return current;
			},
			text: (current : FrequencyType) => {
				return FrequencyType[current];
			},
		});
	}
	private weaponCrateWrapper(msg : GameConfigMessage) : SettingWrapper<FrequencyType> {
		return new SettingWrapper<FrequencyType>({
			name: "Weapon Crate Spawn Rate",
			value: msg.getWeaponCrateSpawn(),
			click: (current : FrequencyType) => {
				if (current === FrequencyType.HIGH) {
					current = FrequencyType.NEVER;
				} else {
					current++;
				}
				msg.setWeaponCrateSpawn(current);
				return current;
			},
			text: (current : FrequencyType) => {
				return FrequencyType[current];
			},
		});
	}

}