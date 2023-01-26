import { game } from 'game'

import { ChannelType } from 'network/connection'
import { ChannelMap, ChannelStat } from 'network/channel_map'

import { ui, HandlerType, Mode } from 'ui'
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

	setup() : void {
		this.updateStats();
	}

	reset() : void {}
	setMode(mode : Mode) : void {}

	private updateStats() {

		if (game.initialized()) {
			const ping = game.connection().ping();
			const fps = game.engine().getFps().toFixed();
			const channelMaps = game.connection().channelMaps();

			let tcp = 0;
			let udp = 0;
			let bytes = 0;
			channelMaps.forEach((channelMap : ChannelMap) => {
				tcp += channelMap.flushStat(ChannelType.TCP, ChannelStat.PACKETS);
				udp += channelMap.flushStat(ChannelType.UDP, ChannelStat.PACKETS);
				bytes += channelMap.flushStat(ChannelType.TCP, ChannelStat.BYTES);
				bytes += channelMap.flushStat(ChannelType.UDP, ChannelStat.BYTES);
			});

			let text = [
				"Ping: " + Math.ceil(ping),
				"FPS: " + fps,
				"Frame time: " + game.averageFrameTime().toFixed(1),
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