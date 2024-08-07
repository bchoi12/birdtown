import { game } from 'game'

import { ChannelType, ChannelStat } from 'network/api'
import { Connection } from 'network/connection'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

import { isLocalhost } from 'util/common'

export class StatsHandler extends HandlerBase implements Handler {
	private static readonly _interval = 500;

	private _statsElm : HTMLElement;
	private _customStats : HTMLElement;
	private _showDebug : boolean;

	constructor() {
		super(HandlerType.STATS);

		this._statsElm = Html.elm(Html.divStats);
		this._customStats = Html.span();
		this._showDebug = isLocalhost();

		this._statsElm.append(this._customStats);
	}

	override setup() : void {
		super.setup();

		this.updateStats();
	}

	setDebug(enabled : boolean) : void { this._showDebug = enabled; }

	private updateStats() {
		if (game.initialized()) {
			const ping = game.netcode().ping();
			const pingSuccess = 100 * (1 - game.netcode().pingLoss());

			const gameStats = game.runner().getGameStats();
			const renderStats = game.runner().getRenderStats();

			const stats = game.netcode().stats();
			let text = [game.netcode().room()];

			if (!game.isHost()) {
				text.push("Ping: " + Math.round(ping) + "ms (" + Math.round(pingSuccess) + "%)");
			}

			text.push("Game: " + Math.ceil(gameStats.stepsPerSecond)
					+ " (" + (this._showDebug ? (Math.ceil(renderStats.stepTime) + "/") : "") +
					+ gameStats.stepIntervalMin + "-" + gameStats.stepIntervalMax + "ms)");
			text.push("Render: " + Math.ceil(renderStats.stepsPerSecond)
					+ " (" + (this._showDebug ? (Math.ceil(renderStats.stepTime) + "/") : "") +
					+ renderStats.stepIntervalMin + "-" + renderStats.stepIntervalMax + "ms)");

			if (this._showDebug) {
				text.push("Diff: " + Math.round(game.runner().seqNumDiff()));
				text.push("TCP/s: " + Math.round(stats.get(ChannelType.TCP).get(ChannelStat.PACKETS))
					+ " (" + Math.round(stats.get(ChannelType.TCP).get(ChannelStat.BYTES) / 1024) + "Kb)");
				text.push("UDP/s: " + Math.round(stats.get(ChannelType.UDP).get(ChannelStat.PACKETS))
					+ " (" + Math.round(stats.get(ChannelType.UDP).get(ChannelStat.BYTES) / 1024) + "Kb)");
			}
			this._customStats.textContent = text.join(" | ");
		}

		setTimeout(() => {
			this.updateStats();
		}, StatsHandler._interval);
	}
}