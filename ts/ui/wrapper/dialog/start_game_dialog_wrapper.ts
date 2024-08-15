
import { game } from 'game'
import { GameMode } from 'game/api'

import { GameConfigMessage } from 'message/game_config_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

import { ButtonGroupWrapper } from 'ui/wrapper/button_group_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label_number_wrapper'
import { SettingWrapper } from 'ui/wrapper/setting_wrapper'

export class StartGameDialogWrapper extends DialogWrapper {

	private _mode : GameMode;
	private _configMsg : GameConfigMessage;

	constructor() {
		super();

		this._mode = GameMode.UNKNOWN;
		this._configMsg = null;

		this.titleElm().textContent = "Select a mode";
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
			// TODO: show tooltip on error
			if (this._configMsg !== null) {
				game.controller().startGame(this._configMsg);
			}
		});
	}

	private addGameModePage() : void {
		let pageWrapper = this.addPage();

		let columnsWrapper = ColumnsWrapper.withWeights([3, 6]);
		columnsWrapper.elm().style.fontSize = "0.7em";

		let mode = columnsWrapper.column(0);
		mode.setLegend("Mode");
		let info = columnsWrapper.column(1);
		info.setLegend("Description");

		// Enable line breaks.
		info.contentElm().textContent = "Select a game mode on the left.";

		let modeButtons = new ButtonGroupWrapper();

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Free for all");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.FREE_FOR_ALL;

				info.contentElm().textContent = "2+ players required\r\n\r\nRack up the most points to win. It's everyone for themselves.";
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Survival");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.SURVIVAL;

				info.contentElm().textContent = "2+ players required\r\n\r\nTry not to die.";
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Practice mode");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.PRACTICE;

				info.contentElm().textContent = "No requirements\r\n\r\nDo whatever you want."
			});
		}

		mode.contentElm().appendChild(modeButtons.elm());
		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setOnSubmit(() => {
			if (this._mode !== GameMode.UNKNOWN) {
				this._configMsg = GameConfigMessage.defaultConfig(this._mode);

				// TODO: check if enough players or something

				switch (this._mode) {
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
		this.titleElm().textContent = "Free for All";

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);
		columnsWrapper.elm().style.fontSize = "0.9em";

		let options = columnsWrapper.column(0);
		options.setLegend("Options");

		let players = columnsWrapper.column(1);
		players.setLegend("Players");

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

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setOnSubmit(() => {
			this._configMsg.setPoints(points.number());
			this._configMsg.setVictories(victories.number());
		});
	}

	private addSurvivalPage() : void {
		let pageWrapper = this.addPage();
		this.titleElm().textContent = "Survival";

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);
		columnsWrapper.elm().style.fontSize = "0.9em";

		let options = columnsWrapper.column(0);
		options.setLegend("Options");

		let players = columnsWrapper.column(1);
		players.setLegend("Players");

		let lives = new LabelNumberWrapper({
			label: "Lives",
			value: 2,
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

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		pageWrapper.setOnSubmit(() => {
			this._configMsg.setLives(lives.number());
			this._configMsg.setVictories(victories.number());
		});
	}
}