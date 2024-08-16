
import { game } from 'game'
import { GameMode } from 'game/api'
import { GameMaker } from 'game/system/game_maker'

import { GameConfigMessage } from 'message/game_config_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { KeyNames } from 'ui/common/key_names'

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
					"It's every bird for themselves. Score points by cooking other players. " +
					"The first player to reach the score limit or have the most points when time runs out wins the round"

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
					"Be the last bird standing. " + 
					"Each player starts with the same number of lives. " +
					"The last player standing wins the round. If time runs out, the round ends in a draw."
				error.textContent = "";
			});
		}

		{
			let buttonWrapper = modeButtons.addButtonSelect();
			buttonWrapper.elm().style.width = "100%";
			buttonWrapper.setText("Practice mode");
			buttonWrapper.addOnClick(() => {
				this._mode = GameMode.PRACTICE;

				requirements.innerHTML = "<li>No requirements</li>"

				description.textContent = "There are no rules. If you get bored, press " + KeyNames.boxed(settings.menuKeyCode) + " to return to the lobby.";

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