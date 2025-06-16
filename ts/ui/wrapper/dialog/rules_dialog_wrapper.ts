
import { game } from 'game'
import { GameMode } from 'game/api'
import { Entity } from 'game/entity'
import { EntityType, FrequencyType } from 'game/entity/api'
import { Player } from 'game/entity/player'

import { GameConfigMessage } from 'message/game_config_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ColumnWrapper } from 'ui/wrapper/column_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { Strings } from 'strings'
import { StringFactory } from 'strings/string_factory'

export class RulesDialogWrapper extends DialogWrapper {

	private _rulesColumn : ColumnWrapper;
	private _playerColumn : ColumnWrapper;
	private _nameWrapper : NameWrapper;
	private _equipElm : HTMLElement;

	constructor() {
		super();

		this.shrink();
		this.setTitle("Game Info");

		let pageWrapper = this.addPage();

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);
		columnsWrapper.elm().style.fontSize = "0.7em";
		pageWrapper.elm().appendChild(columnsWrapper.elm());

		this._playerColumn = columnsWrapper.column(1);
		this._nameWrapper = new NameWrapper();
		this._playerColumn.contentElm().appendChild(this._nameWrapper.elm());
		this._equipElm = Html.div();
		this._playerColumn.contentElm().appendChild(this._equipElm);

		this._rulesColumn = columnsWrapper.column(0);
	}

	override onShow() : void {
		super.onShow();

		this.updatePlayer();
	}

	setGameConfig(config : GameConfigMessage) : void {
		switch (config.type()) {
		case GameMode.FREE:
			this.setRules(config.modeName(), [
				"Room: " + game.netcode().room(),
			]);
			break;
		default:
			let rules = [];

			rules.push(StringFactory.getModeDescription(config));
			rules.push(`Level is ${StringFactory.getLevelName(config.getLevelType())}`)

			if (config.hasVictories()) {
				rules.push(`First to ${config.getVictories()} round ${Strings.plural("win", config.getVictories())}`);
			}
			if (config.hasPoints()) {
				rules.push(`${config.getPoints()} ${Strings.plural("point", config.getPoints())} to win the round`)
			}
			if (config.hasLives()) {
				rules.push(`Start with ${config.getLives()} ${Strings.plural("life", config.getLives())}`);
			}
			if (config.getResetPointsOr(false)) {
				rules.push(`Lose all of your points on death`);
			}
			if (config.hasStartingLoadout()) {
				rules.push(`Starting loadout is ${StringFactory.getLoadoutName(config.getStartingLoadout())}`);
			}
			if (config.hasDamageMultiplier() && config.getDamageMultiplier() !== 1) {
				rules.push(`${config.getDamageMultiplier().toFixed(1)}x damage`);
			}
			if (config.hasHealthCrateSpawn()) {
				rules.push(`Health crate spawn rate is ${FrequencyType[config.getHealthCrateSpawn()].toLowerCase()}`);
			}
			if (config.hasWeaponCrateSpawn()) {
				rules.push(`Weapon crate spawn rate is ${FrequencyType[config.getWeaponCrateSpawn()].toLowerCase()}`);
			}

			this.setRules(config.modeName(), rules);
		}
	}

	private setRules(mode : string, rules : Array<string>) : void {
		let html = mode;
		html += "<ul>";
		rules.forEach((rule : string) => {
			html += `<li>${rule}</li>`;
		})
		html += "</ul>";

		this._rulesColumn.contentElm().innerHTML = html;
	}

	private updatePlayer() : void {
		if (!game.lakitu().validTargetEntity()) {
			return;
		}

		const target = game.lakitu().targetEntity();
		if (target.hasClientId()) {
			this._nameWrapper.setClientId(target.clientId());
		}

		if (target.type() === EntityType.PLAYER) {
			const player = <Player>target;
			this.updateEquips([player.equipType(), player.altEquipType()]);
		}
	}

	private updateEquips(types : Array<EntityType>) : void {
		let html = "<ul>";
		types.forEach((type : EntityType) => {
			if (type === EntityType.UNKNOWN) {
				return;
			}

			if (!StringFactory.hasEntityUsage(type)) {
				return;
			}

			html += "<li>";
			html += StringFactory.getEntityTypeName(type).toTitleString()
			html += " - " + StringFactory.getEntityUsage(type);
			html += "</li>";
		});
		html += "</ul>";

		this._equipElm.innerHTML = html;
	}
}