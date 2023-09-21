import { game } from 'game'


import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ChannelType } from 'network/api'
import { ChannelMap, ChannelStat } from 'network/channel_map'
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
			const fps = game.engine().getFps().toFixed();

			let tcp = 0;
			let udp = 0;
			let bytes = 0;
			game.netcode().connections().forEach((connection : Connection) => {
				tcp += connection.channels().flushStat(ChannelType.TCP, ChannelStat.PACKETS);
				udp += connection.channels().flushStat(ChannelType.UDP, ChannelStat.PACKETS);
				bytes += connection.channels().flushStat(ChannelType.TCP, ChannelStat.BYTES);
				bytes += connection.channels().flushStat(ChannelType.UDP, ChannelStat.BYTES);
			});

			let text = [
				"Ping: " + Math.ceil(ping) + " ms (" + Math.ceil(pingSuccess) + "%)",
				"FPS: " + fps + " (" + Math.ceil(game.stepTime()) + "+" + Math.ceil(game.renderTime()) + " ms)",
				"Diff: " + Math.round(game.runner().seqNumDiff()),
				"TCP/s: " + Math.ceil(tcp),
				"UDP/s: " + Math.ceil(udp),
				"Kb/s: " + Math.ceil(bytes / 1024),
			];
			this._customStats.textContent = text.join(" | ");
		}

		setTimeout(() => {
			this.updateStats();
		}, StatsHandler._intervalSec * 1000);
	}
}