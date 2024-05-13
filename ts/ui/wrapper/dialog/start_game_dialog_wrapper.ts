
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

		this.titleElm().textContent = "Start a game";
		this.addGameModePage();

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});

		this.addOnSubmit(() => {
			if (this._configMsg !== null) {
				game.controller().startGame(this._configMsg);
			}
		});
	}

	private addGameModePage() : void {
		let pageWrapper = this.addPage();

		let columnsWrapper = ColumnsWrapper.withWeights([4, 6]);
		columnsWrapper.elm().style.fontSize = "0.7em";

		let modeElm = columnsWrapper.columnElm(0);
		let infoElm = columnsWrapper.columnElm(1);

		// Enable line breaks.
		infoElm.style.whiteSpace = "pre";
		infoElm.textContent = "Select a game mode on the left.";

		let modeButtons = new ButtonGroupWrapper();

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Survival");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.SURVIVAL;

				infoElm.textContent = "2+ players required\r\n\r\nTry not to die.";
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Practice mode");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.PRACTICE;

				infoElm.textContent = "No requirements\r\n\r\nDo whatever you want."
			});
		}

		modeElm.appendChild(modeButtons.elm());
		pageWrapper.elm().appendChild(columnsWrapper.elm());

		this.addOnNextPageOnce(() => {
			if (this._mode !== GameMode.UNKNOWN) {
				this._configMsg = GameConfigMessage.defaultConfig(this._mode);

				// TODO: check if enough players or something

				switch (this._mode) {
				case GameMode.SURVIVAL:
					console.log("ADD SURVIVAL PAGE");
					this.addSurvivalPage();
					break;
				}
			}
		});
	}

	private addSurvivalPage() : void {
		let pageWrapper = this.addPage();

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);
		columnsWrapper.elm().style.fontSize = "0.9em";

		let leftElm = columnsWrapper.columnElm(0);
		let rightElm = columnsWrapper.columnElm(1);

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
		leftElm.appendChild(lives.elm());

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
		leftElm.appendChild(victories.elm());

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		console.log(this, "ADD SETTINGS TO CONFIG MSG");
		// TODO: this doesn't work???????
		this.addOnNextPageOnce(() => {
			this._configMsg.setLives(lives.value());
			this._configMsg.setVictories(victories.value());

			console.log("DONE")
		});
	}
}