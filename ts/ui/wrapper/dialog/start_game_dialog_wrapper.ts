
import { game } from 'game'
import { GameMode } from 'game/api'

import { GameConfigMessage } from 'message/game_config_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'

export class StartGameDialogWrapper extends DialogWrapper {

	private _mode : GameMode;
	private _configMsg : GameConfigMessage;

	constructor() {
		super();

		this._mode = GameMode.UNKNOWN;
		this._configMsg = null;

		this.titleElm().textContent = "Start a game";
		this.addGameModePage();

		this.addOnSubmit(() => {
			if (this._configMsg !== null) {
				game.controller().startGame(this._configMsg);
			}
		});
	}

	private addGameModePage() : void {
		let pageWrapper = this.addPage();

		let columnsWrapper = ColumnsWrapper.withWeights([4, 6]);
		let modeElm = columnsWrapper.columnElm(0);
		let infoElm = columnsWrapper.columnElm(1);

		infoElm.textContent = "Select a game mode on the left.";

		{
			let buttonWrapper = new ButtonWrapper();
			buttonWrapper.setText("Survival");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.SURVIVAL;

				infoElm.textContent = "DONT DIE";
			});
			modeElm.appendChild(buttonWrapper.elm());
		}

		{
			let buttonWrapper = new ButtonWrapper();
			buttonWrapper.setText("Practice mode (WIP)");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.UNKNOWN;

				infoElm.textContent = "Practice mode COMING SOON"
			});
			modeElm.appendChild(buttonWrapper.elm());
		}

		pageWrapper.elm().appendChild(columnsWrapper.elm());

		let buttonWrapper = new ButtonWrapper();
		buttonWrapper.setText("OK");
		buttonWrapper.addOnClick(() => {
			if (this._mode !== GameMode.UNKNOWN) {
				this._configMsg = GameConfigMessage.defaultConfig(this._mode);
			}
			this.nextPage();
		});
		this.footerElm().appendChild(buttonWrapper.elm());
	}
}