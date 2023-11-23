import { game } from 'game'


import { UiMessage, UiMessageType } from 'message/ui_message'

import { ChannelType, ChannelStat } from 'network/api'
import { Connection } from 'network/connection'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

export class StatsHandler extends HandlerBase implements Handler {
	private static readonly _intervalSec = 0.5;

	private _statsElm : HTMLElement;
	private _customStats : HTMLElement;

	constructor() {
		super(HandlerType.STATS);

		this._statsElm = Html.elm(Html.divStats);
		this._customStats = Html.span();
		this._statsElm.append(this._customStats);
	}

	override setup() : void {
		this.updateStats();
	}

	private updateStats() {
		if (game.initialized()) {
			const ping = game.netcode().ping();
			const pingSuccess = 100 * (1 - game.netcode().pingLoss());

			const gameStats = game.runner().getGameStats();
			const renderStats = game.runner().getRenderStats();

			const stats = game.netcode().stats();
			let text = [
				"Ping: " + Math.round(ping) + "ms (" + Math.round(pingSuccess) + "%)",
				"Game: " + Math.ceil(gameStats.stepsPerSecond) + " (" + Math.ceil(gameStats.stepTime) + "/" + Math.ceil(gameStats.stepInterval) + "ms)",
				"Render: " + Math.ceil(renderStats.stepsPerSecond) + " (" + Math.ceil(renderStats.stepTime) + "/" + Math.ceil(renderStats.stepInterval) + "ms)",
				"Diff: " + Math.round(game.runner().seqNumDiff()),
				"TCP/s: " + Math.round(stats.get(ChannelType.TCP).get(ChannelStat.PACKETS))
					+ " (" + Math.round(stats.get(ChannelType.TCP).get(ChannelStat.BYTES) / 1024) + "Kb)",
				"UDP/s: " + Math.round(stats.get(ChannelType.UDP).get(ChannelStat.PACKETS))
					+ " (" + Math.round(stats.get(ChannelType.UDP).get(ChannelStat.BYTES) / 1024) + "Kb)",
			];
			this._customStats.textContent = text.join(" | ");
		}

		setTimeout(() => {
			this.updateStats();
		}, StatsHandler._intervalSec * 1000);
	}
}