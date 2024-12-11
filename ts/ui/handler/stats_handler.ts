import { game } from 'game'

import { ChannelType, ChannelStat } from 'network/api'
import { Connection } from 'network/connection'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { StatWrapper } from 'ui/wrapper/stat_wrapper'

export class StatsHandler extends HandlerBase implements Handler {

	private static readonly _interval = 500;

	private _statsElm : HTMLElement;
	private _customStats : HTMLElement;
	private _statWrappers : Array<StatWrapper>;
	private _showDebug : boolean;

	private _signalingDisconnected : boolean;

	constructor() {
		super(HandlerType.STATS);

		this._statsElm = Html.elm(Html.divStats);
		this._customStats = Html.span();
		this._showDebug = false;
		this._statWrappers = new Array();

		this._signalingDisconnected = false;

		this._statsElm.append(this._customStats);
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		// Ping or signaling
		if (game.isHost()) {
			this.addStat(new StatWrapper({
				icon: IconType.NETWORK_SIGNAL,

				goodPercent: 1,
				badPercent: 0,
				iconOnly: true,
				suffix: " " + game.netcode().room(),

				get: () => { return this._signalingDisconnected ? 0 : 1; },
				getTarget: () => { return 1; },
			}));
		} else {
			this.addStat(new StatWrapper({
				icon: IconType.NETWORK_SIGNAL,

				goodPercent: 0.6,
				badPercent: 1.5,
				suffix: "ms",

				get: () => { return Math.round(game.netcode().ping()); },
				getTarget: () => { return 100; },
			}));
		}

		// Tick
		this.addStat(new StatWrapper({
			icon: IconType.UPDATE,

			goodPercent: 0.85,
			badPercent: 0.7,
			suffix: "hz",

			get: () => { return Math.round(game.runner().gameStats().rate()); },
			getTarget: () => { return game.runner().tickRate(); },
		}));

		// Render
		this.addStat(new StatWrapper({
			icon: IconType.RENDER,

			goodPercent: 0.9,
			badPercent: 0.8,
			suffix: "fps",

			get: () => { return Math.round(game.runner().renderStats().rate()); },
			getTarget: () => { return game.runner().renderRate(); },
		}));

		this.updateStats();
	}

	setSignalingDisconnected(disconnected : boolean) : void { this._signalingDisconnected = disconnected; }
	setDebug(enabled : boolean) : void {
		this._showDebug = enabled;

		if (!enabled) {
			this._customStats.textContent = "";
		}
	}

	private addStat(wrapper : StatWrapper) : void {
		this._statWrappers.push(wrapper);
		this._statsElm.append(wrapper.elm());
	}

	private updateStats() {
		if (game.initialized()) {
			this._statWrappers.forEach((wrapper : StatWrapper) => {
				wrapper.refresh();
			});

			let gameStats = game.runner().gameStats();
			let renderStats = game.runner().renderStats();

			if (this._showDebug) {
				const stats = game.netcode().stats();

				let text = [];
				text.push("Game: " + Math.round(gameStats.minTickTime()) + "-" + Math.round(gameStats.maxTickTime()) + "ms");
				text.push("Render: " + Math.round(renderStats.minTickTime()) + "-" + Math.round(renderStats.maxTickTime()) + "ms")
				text.push("Diff: " + Math.round(game.runner().tickDiff()));
				text.push("TCP/s: " + Math.round(stats.get(ChannelType.TCP).get(ChannelStat.PACKETS))
					+ " (" + Math.round(stats.get(ChannelType.TCP).get(ChannelStat.BYTES) / 1024) + "Kb)");
				text.push("UDP/s: " + Math.round(stats.get(ChannelType.UDP).get(ChannelStat.PACKETS))
					+ " (" + Math.round(stats.get(ChannelType.UDP).get(ChannelStat.BYTES) / 1024) + "Kb)");
				this._customStats.textContent = text.join(" | ");
			}

			gameStats.resetMinMax();
			renderStats.resetMinMax();
		}

		setTimeout(() => {
			this.updateStats();
		}, StatsHandler._interval);
	}
}