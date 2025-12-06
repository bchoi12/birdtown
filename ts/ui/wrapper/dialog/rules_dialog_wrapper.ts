
import { game } from 'game'
import { GameMode } from 'game/api'
import { Buff } from 'game/component/buff'
import { Buffs } from 'game/component/buffs'
import { Entity } from 'game/entity'
import { EntityType, FrequencyType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { StatType } from 'game/factory/api'

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
	private _statsElm : HTMLElement;

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
		this._statsElm = Html.div();
		this._statsElm.style.listStyleType = "none";
		this._playerColumn.contentElm().appendChild(this._statsElm);

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

			if (config.hasLives()) {
				rules.push(`Everyone has ${config.getLives()} ${Strings.plural("life", config.getLives())}`);
			}
			if (config.hasVictories()) {
				rules.push(`Be the first to ${config.getVictories()} ${Strings.plural("win", config.getVictories())}`);
			}
			if (config.getResetPointsOr(false)) {
				rules.push(`Lose all of your points on death`);
			}
			if (config.hasFriendlyFire() && config.getFriendlyFire()) {
				rules.push(`Friendly fire is enabled`);
			}
			if (config.hasDamageMultiplier() && config.getDamageMultiplier() !== 1) {
				rules.push(`${config.getDamageMultiplier().toFixed(1)}x damage`);
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

			this.updateBuffs(player.buffs());
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

	private updateStats(cache : Map<StatType, number>) : void {
		let html = "<ul>";
		cache.forEach((value : number, type : StatType) => {
			if (Math.abs(value) < 1e-3) {
				return;
			}

			html += "<li>";
			html += StringFactory.getStat(type, value);
			html += "</li>";
		});
		html += "</ul>";

		this._statsElm.innerHTML = html;
	}

	private updateBuffs(buffs : Buffs) : void {
		let html = "<ul>";

		buffs.execute((buff : Buff) => {
			if (buff.level() <= 0 || !StringFactory.hasBuffName(buff.buffType())) {
				return;
			}

			html += "<li>";
			html += `${StringFactory.getBuffName(buff.buffType())} Lv${buff.level()}/${buff.maxLevel()}`;
			html += "</li>";
		});

		html += "</ul>";

		this._statsElm.innerHTML = html;

	}
}