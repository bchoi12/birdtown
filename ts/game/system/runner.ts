import { game } from 'game'
import { GameState } from 'game/api'
import { GameData, DataFilter } from 'game/game_data'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameGlobals } from 'global/game_globals'

import { Message, DataMap } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { ChannelType } from 'network/api'

import { settings } from 'settings'
import { SpeedSetting } from 'settings/api'

import { ui } from 'ui'
import { DialogType, StatusType } from 'ui/api'

import { RunnerStats } from 'util/runner_stats'

export class Runner extends SystemBase implements System  {

	private static readonly _tickerFile = "ticker.js";
	private static readonly _targetTick = 1000 / GameGlobals.targetTickRate;

	// Snap seqNum to host when time diff is above a threshold
	private static readonly _clientSnapThreshold = 1000;

	// Max speedup is 15%
	private static readonly _tickTolerance = 0.15;
	private static readonly _maxSpeedUp = 1 + Runner._tickTolerance;

	private static readonly _warmupTime = 3000;
	private static readonly _degradedThreshold = 0.75;
	private static readonly _okThreshold = 0.85;

	private static readonly _channelMapping = new Map<DataFilter, ChannelType>([
		[DataFilter.INIT, ChannelType.TCP],
		[DataFilter.TCP, ChannelType.TCP],
		[DataFilter.UDP, ChannelType.UDP],
	]);

	private _ticker : Worker;
	private _tickRate : number;
	private _skipTickThreshold : number;
	private _updateEveryN : number;
	private _renderEveryN : number;
	private _tickNum : number;
	private _step : number;
	private _seqNum : number;
	private _updateSpeed : number;
	private _skipCounter : number;
	private _lastUpdateTime : number;
	private _lastRenderTime : number;

	private _gameStats : RunnerStats;
	private _renderStats : RunnerStats;

	private _importSeqNum : number;
	private _seqNumDiff : number;
	private _sendFullMsg : boolean;
	private _degraded : boolean;
	private _hostDegraded : boolean;
	private _hostVersion : string;

	constructor() {
		super(SystemType.RUNNER);

		this._ticker = new Worker(Runner._tickerFile);
		this._tickRate = 0;
		this._skipTickThreshold = 0;
		this._updateEveryN = 1;
		this._renderEveryN = 1;
		this._tickNum = 0;
		this._step = 0;
		this._seqNum = 0;
		this._updateSpeed = 1;
		this._lastUpdateTime = Date.now();
		this._lastRenderTime = Date.now();

		this._gameStats = new RunnerStats(GameGlobals.targetTickRate);
		this._renderStats = new RunnerStats(GameGlobals.targetTickRate);

		this._importSeqNum = 0;
		this._seqNumDiff = 0;
		this._sendFullMsg = false;
		this._degraded = false;
		this._hostDegraded = false;
		this._hostVersion = "";

	   	this._ticker.onerror = (e) => {
	   		console.error(e);
	   	}

	   	this.addProp<string>({
	   		export: () => { return GameGlobals.version; },
	   		import: (obj : string) => { this.checkVersionMismatch(obj); },
	   		options: {
	   			filters: GameData.initFilters,
	   		}
	   	})
	   	this.addProp<number>({
	   		export: () => { return this._updateSpeed; },
	   		import: (obj : number) => { this.setUpdateSpeed(obj); },
	   	})
		this.addProp<boolean>({
			export: () => { return this._degraded; },
			import: (obj : boolean) => { this.setHostDegraded(obj); }
		});
	}

	override ready() : boolean {
		return super.ready() && game.hasClientId();
	}

	override initialize() : void {
		super.initialize();

		this._lastUpdateTime = Date.now();

		this.setTickRate(GameGlobals.targetTickRate);
	   	this._ticker.onmessage = (msg : any) => {
	   		// Prevent spiral of death
	   		if (Math.abs(Date.now() - msg.data) > this._skipTickThreshold) {
	   			return;
	   		}

	   		this._tickNum++;
		   	game.netcode().flush();

			let skipUpdate = this._tickNum % this._updateEveryN !== 0;

		   	const updateInterval = Date.now() - this._lastUpdateTime;
			if (!skipUpdate) {
		   		this._lastUpdateTime = Date.now();
			}

		   	// No need to do anything
		   	if (!ui.focused()) {
		   		return;
		   	}

			if (!skipUpdate) {
				this._step = this.getGameStep(updateInterval);
				this._seqNum += Math.round(this._step);
		
		   		const stepData = {
		   			millis: this._updateSpeed * this._step,
		   			realMillis: this._step,
		   			seqNum: this._seqNum,
		   		};
		   		this.gameStep(stepData);

		   		const updateTime = Date.now() - this._lastUpdateTime;
	   			this._gameStats.logTick(updateInterval, updateTime, stepData);

	   			const ratio = this._gameStats.rate() / GameGlobals.targetTickRate;
	   			if (ratio < Runner._degradedThreshold) {
	   				this.setDegraded(true);
	   			} else if (ratio > Runner._okThreshold) {
	   				this.setDegraded(false);
	   			}
			}
			
			let skipRender = this._tickNum % this._renderEveryN !== 0;
		   	const renderInterval = Date.now() - this._lastRenderTime;

		   	if (!skipRender) {
	   			this._lastRenderTime = Date.now();
		   	}

   			const startRenderTime = Date.now();
			this.preRender();
			if (!skipRender) {
				this.render();
			}
			this.postRender();

			if (!skipRender) {
				const renderTime = Date.now() - startRenderTime;
				this._renderStats.logTick(renderInterval, renderTime);
			}
	   	};
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (!this.isSource()) {
			return;
		}

		switch(msg.type()) {
		case GameMessageType.CLIENT_JOIN:
		case GameMessageType.LEVEL_LOAD:
			this._sendFullMsg = true;
			break;
		case GameMessageType.CLIENT_DISCONNECT:
			game.netcode().handleDisconnect(msg);
			break;
		}
	}

	setGameState(state : GameState) : void {
		switch (state) {
		case GameState.PRELOAD:
			// No change
			break;
		case GameState.FINISH:
		case GameState.VICTORY:
		case GameState.ERROR:
			this.setUpdateSpeed(0.3);
			break;
		default:
			this.setUpdateSpeed(1);
		}
	}

	setTickRate(rate : number) : void {
		if (rate <= 0) {
			return;
		}

		this._tickRate = rate;
		this.setTemporaryTickRate(this._tickRate);
	}
	resumeTickRate() : void {
		this.setTickRate(this._tickRate);
	}
	setTemporaryTickRate(rate : number) : void {
		if (rate <= 0) {
			return;
		}

		this._ticker.postMessage(rate);
		this._skipTickThreshold = Math.round(1.25 * 1000 / rate);
	}

	pause() : void {
		if (!this.initialized()) {
			return;
		}

		// Run slowly so we can still read some messages
		this.setTemporaryTickRate(3);

		this.setDegraded(true);
	}
	resume() : void {
		if (!this.initialized()) {
			return;
		}

		this.resumeTickRate();

		this.setDegraded(false);
	}
	push<T extends System>(system : T) : void {
		if (this.hasChild(system.type())) {
			console.error("Error: skipping duplicate system with type %d, name %s", system.type(), system.name());
			return;
		}
		this.registerChild(system.type(), system);
	}

	getSystem<T extends System>(type : SystemType) : T { return this.getChild<T>(type); }

	setRenderSpeed(speed : number) : void {
		this.setTickRate(Math.max(60, speed));

		this._updateEveryN = Math.max(1, Math.round(speed / 60));
		this._renderEveryN = Math.max(1, Math.round(60 / speed));
	}

	updateSpeed() : number { return this._updateSpeed; }
	setUpdateSpeed(speed : number) : void { this._updateSpeed = speed; }
	gameStats() : RunnerStats { return this._gameStats; }
	renderStats() : RunnerStats { return this._renderStats; }
	renderRate() : number { return this._tickRate / this._renderEveryN; }
 	lastStep() : number { return this._step; }
 	tickNum() : number { return this._tickNum; }
	seqNumDiff() : number { return this.isSource() ? 0 : this._seqNumDiff; }
	tickDiff() : number { return Math.round(this.seqNumDiff() / Runner._targetTick); }
 
	private getGameStep(millis : number) : number {
		if (this.isSource()) {
			millis = Math.min(millis, Runner._maxSpeedUp * Runner._targetTick);
		} else {
			this._seqNumDiff = this._seqNum - this._importSeqNum;

			if (this._seqNumDiff >= Runner._clientSnapThreshold) {
				// Reset because client is too far ahead
				this._seqNum = this._importSeqNum;

				if (ui.focused()) {
					this.setHostBehind(true);
				}
				return millis;
			} else if (this._seqNumDiff <= 0) {
				// We are behind, get back in sync and operate as normal
				// If we fall behind, our client-side inputs may be overwritten
				this._seqNum = this._importSeqNum;
				return millis;
			} else {
				// Magic slowdown/speedup formula
				const coeff = 1 - Math.sign(this._seqNumDiff) * Math.min(Runner._tickTolerance, Math.abs(this._seqNumDiff) / Runner._clientSnapThreshold);
				millis *= coeff;
				return millis;
			}
		}
		return millis;
	}

	private gameStep(stepData : StepData) : void {
    	this.preUpdate(stepData);
    	this.update(stepData);
    	this.postUpdate(stepData);
    	this.prePhysics(stepData);
    	this.physics(stepData);
    	this.postPhysics(stepData);
    	this.updateData(stepData.seqNum);

    	for (const filter of this.getDataFilters()) {
			const [data, has] = this.dataMap(filter, stepData.seqNum);
			if (!has) {
				continue;
			}

			let msg = new NetworkMessage(NetworkMessageType.GAME);
			msg.setSeqNum(stepData.seqNum);
			msg.setData(data);
			game.netcode().broadcast(Runner._channelMapping.get(filter), msg);
    	}
    	this.cleanup();
    	ui.clearKeys();
	}

	private setDegraded(degraded : boolean) : void {
		if (this._degraded === degraded) {
			return;
		}

		this._degraded = degraded;

		if (this._degraded) {
	   		if (ui.focused() && ui.timeSinceFocusChange() > Runner._warmupTime) {
				ui.addStatus(StatusType.DEGRADED);
			}
		}
	}
	private setHostDegraded(degraded : boolean) : void {
		this._hostDegraded = degraded;

		if (this._hostDegraded) {
			ui.addStatus(StatusType.HOST_DEGRADED);
		}
	}
	private setHostBehind(behind : boolean) : void {
		if (behind) {
			ui.addStatus(StatusType.HOST_DEGRADED);
		}
	}
	hostVersion() : string { return this._hostVersion; }
	private checkVersionMismatch(version : string) : void {
		if (GameGlobals.version === version) {
			return;
		}

		this._hostVersion = version;
		ui.pushDialog(DialogType.VERSION_MISMATCH);
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		this._importSeqNum = Math.max(this._importSeqNum, seqNum);
	}

	private getDataFilters() : Array<DataFilter> {
		if (this._sendFullMsg) {
			this._sendFullMsg = false;
			return [DataFilter.INIT];
		}
		return [DataFilter.TCP, DataFilter.UDP];
	}
}