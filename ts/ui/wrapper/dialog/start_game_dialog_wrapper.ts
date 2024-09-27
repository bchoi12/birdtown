
import { game } from 'game'
import { GameMode } from 'game/api'
import { FrequencyType } from 'game/entity/api'
import { PlayerRole } from 'game/system/api'
import { GameMaker } from 'game/system/game_maker'
import { ClientConfig, ClientInfo } from 'game/util/client_config'

import { GameConfigMessage } from 'message/game_config_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { KeyNames } from 'ui/common/key_names'

import { ButtonGroupWrapper } from 'ui/wrapper/button_group_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ClientConfigWrapper } from 'ui/wrapper/client_config_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'

type ModePageOptions = {
	
}

export class StartGameDialogWrapper extends DialogWrapper {

	private _mode : GameMode;
	private _configMsg : GameConfigMessage;
	private _clientConfig : ClientConfig;

	constructor() {
		super();

		this._mode = GameMode.UNKNOWN;
		this._configMsg = null;
		this._clientConfig = null;

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
			if (this._configMsg !== null && this._clientConfig !== null) {
				game.controller().startGame(this._configMsg, this._clientConfig);
			}
		});
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

		let description = Html.div();
		let requirements = Html.div();
		let error = Html.div();

		info.contentElm().appendChild(description);
		info.contentElm().appendChild(Html.br());
		info.contentElm().appendChild(requirements);
		info.contentElm().appendChild(Html.br());
		info.contentElm().appendChild(error);

		description.textContent = "Select a game mode on the left.";

		let modeButtons = new ButtonGroupWrapper();
		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Free for all");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.FREE_FOR_ALL;

				requirements.innerHTML = "<li>2+ players required</li>"

				description.textContent =
					"It's everyone for themselves.\r\n\r\nScore points by cooking other players. " +
					"The first player to reach the score limit or have the most points when time runs out wins the round."

				error.textContent = "";
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Survival");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.SURVIVAL;

				requirements.innerHTML = "<li>2+ players required</li>"

				description.textContent =
					"Be the last bird standing.\r\n\r\n" + 
					"Each player starts with the same number of lives. " +
					"The last player standing wins the round. If time runs out, the round ends in a draw."
				error.textContent = "";
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Practice Mode");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.PRACTICE;

				requirements.innerHTML = "<li>No requirements</li>"

				description.textContent = "There are no rules.";

				error.textContent = "";
			});
		}

		mode.contentElm().appendChild(modeButtons.elm());
		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setCanSubmit(() => {
			if (this._mode === GameMode.UNKNOWN) {
				error.textContent = "No game mode selected!";
				return false;
			}
			const [canSubmit, submitError] = GameMaker.canStart(this._mode);
			error.textContent = submitError;
			return canSubmit;
		})

		pageWrapper.setOnSubmit(() => {
			if (this._mode !== GameMode.UNKNOWN) {
				this._configMsg = GameConfigMessage.defaultConfig(this._mode);

				switch (this._mode) {
				case GameMode.PRACTICE:
					this.addPracticePage();
					break;
				case GameMode.SURVIVAL:
					this.addSurvivalPage();
					break;
				case GameMode.FREE_FOR_ALL:
					this.addFreeForAllPage();
					break;
				}
			}
		});
	}

	private addFreeForAllPage() : void {
		let pageWrapper = this.addPage();
		this.setTitle("Free for All");

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);

		let options = columnsWrapper.column(0);
		options.setLegend("Options");
		options.contentElm().style.fontSize = "0.6em";

		let points = new LabelNumberWrapper({
			label: "Points for a win",
			value: 5,
			plus: (current : number) => {
				return Math.min(current + 1, 10);
			},
			minus: (current : number) => {
				return Math.max(1, current - 1);
			},
		});
		options.contentElm().appendChild(points.elm());

		let victories = new LabelNumberWrapper({
			label: "First to N wins",
			value: 3,
			plus: (current : number) => {
				return Math.min(current + 1, 5);
			},
			minus: (current : number) => {
				return Math.max(1, current - 1);
			},
		});
		options.contentElm().appendChild(victories.elm());

		let healthCrates = new SettingWrapper<FrequencyType>({
			name: "Health Crate Spawn Rate",
			value: this._configMsg.getHealthCrateSpawn(),
			click: (current : FrequencyType) => {
				if (current === FrequencyType.HIGH) {
					current = FrequencyType.NEVER;
				} else {
					current++;
				}
				return current;
			},
			text: (current : FrequencyType) => {
				return FrequencyType[current];
			},
		});
		options.contentElm().appendChild(healthCrates.elm());

		let weaponCrates = new SettingWrapper<FrequencyType>({
			name: "Weapon Crate Spawn Rate",
			value: this._configMsg.getWeaponCrateSpawn(),
			click: (current : FrequencyType) => {
				if (current === FrequencyType.HIGH) {
					current = FrequencyType.NEVER;
				} else {
					current++;
				}
				return current;
			},
			text: (current : FrequencyType) => {
				return FrequencyType[current];
			},
		});
		options.contentElm().appendChild(weaponCrates.elm());

		let players = columnsWrapper.column(1);
		players.setLegend("Players");
		players.contentElm().style.fontSize = "0.6em";

		let clientConfigWrapper = new ClientConfigWrapper();
		players.contentElm().appendChild(clientConfigWrapper.elm());

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setOnSubmit(() => {
			this._configMsg.setPoints(points.number());
			this._configMsg.setVictories(victories.number());
			this._configMsg.setHealthCrateSpawn(healthCrates.value());
			this._configMsg.setWeaponCrateSpawn(weaponCrates.value());

			this._clientConfig = clientConfigWrapper.config();
		});
	}

	private addSurvivalPage() : void {
		let pageWrapper = this.addPage();
		this.setTitle("Survival");

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);

		let options = columnsWrapper.column(0);
		options.setLegend("Options");
		options.contentElm().style.fontSize = "0.6em";

		let lives = new LabelNumberWrapper({
			label: "Lives",
			value: 1,
			plus: (current : number) => {
				return Math.min(current + 1, 5);
			},
			minus: (current : number) => {
				return Math.max(1, current - 1);
			},
		});
		options.contentElm().appendChild(lives.elm());

		let victories = new LabelNumberWrapper({
			label: "First to N wins",
			value: 3,
			plus: (current : number) => {
				return Math.min(current + 1, 5);
			},
			minus: (current : number) => {
				return Math.max(1, current - 1);
			},
		});
		options.contentElm().appendChild(victories.elm());

		let healthCrates = new SettingWrapper<FrequencyType>({
			name: "Health Crate Spawn Rate",
			value: this._configMsg.getHealthCrateSpawn(),
			click: (current : FrequencyType) => {
				if (current === FrequencyType.HIGH) {
					current = FrequencyType.NEVER;
				} else {
					current++;
				}
				return current;
			},
			text: (current : FrequencyType) => {
				return FrequencyType[current];
			},
		});
		options.contentElm().appendChild(healthCrates.elm());

		let weaponCrates = new SettingWrapper<FrequencyType>({
			name: "Weapon Crate Spawn Rate",
			value: this._configMsg.getWeaponCrateSpawn(),
			click: (current : FrequencyType) => {
				if (current === FrequencyType.HIGH) {
					current = FrequencyType.NEVER;
				} else {
					current++;
				}
				return current;
			},
			text: (current : FrequencyType) => {
				return FrequencyType[current];
			},
		});
		options.contentElm().appendChild(weaponCrates.elm());

		let players = columnsWrapper.column(1);
		players.setLegend("Players");
		players.contentElm().style.fontSize = "0.6em";

		let clientConfigWrapper = new ClientConfigWrapper();
		players.contentElm().appendChild(clientConfigWrapper.elm());

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setOnSubmit(() => {
			this._configMsg.setLives(lives.number());
			this._configMsg.setVictories(victories.number());
			this._configMsg.setHealthCrateSpawn(healthCrates.value());
			this._configMsg.setWeaponCrateSpawn(weaponCrates.value());

			this._clientConfig = clientConfigWrapper.config();
		});
	}

	private addPracticePage() : void {
		let pageWrapper = this.addPage();
		this.setTitle("Practice");

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);

		let options = columnsWrapper.column(0);
		options.setLegend("Options");
		options.contentElm().style.fontSize = "0.6em";

		let healthCrates = new SettingWrapper<FrequencyType>({
			name: "Health Crate Spawn Rate",
			value: this._configMsg.getHealthCrateSpawn(),
			click: (current : FrequencyType) => {
				if (current === FrequencyType.HIGH) {
					current = FrequencyType.NEVER;
				} else {
					current++;
				}
				return current;
			},
			text: (current : FrequencyType) => {
				return FrequencyType[current];
			},
		});
		options.contentElm().appendChild(healthCrates.elm());

		let weaponCrates = new SettingWrapper<FrequencyType>({
			name: "Weapon Crate Spawn Rate",
			value: this._configMsg.getWeaponCrateSpawn(),
			click: (current : FrequencyType) => {
				if (current === FrequencyType.HIGH) {
					current = FrequencyType.NEVER;
				} else {
					current++;
				}
				return current;
			},
			text: (current : FrequencyType) => {
				return FrequencyType[current];
			},
		});
		options.contentElm().appendChild(weaponCrates.elm());

		let players = columnsWrapper.column(1);
		players.setLegend("Players");
		players.contentElm().style.fontSize = "0.6em";

		let clientConfigWrapper = new ClientConfigWrapper();
		players.contentElm().appendChild(clientConfigWrapper.elm());

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setOnSubmit(() => {
			this._configMsg.setHealthCrateSpawn(healthCrates.value());
			this._configMsg.setWeaponCrateSpawn(weaponCrates.value());

			this._clientConfig = clientConfigWrapper.config();
		});
	}

}