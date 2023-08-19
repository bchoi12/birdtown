import { game } from 'game'
import { GameData, DataFilter } from 'game/game_data'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { LevelType } from 'game/system/api'

import { NetworkGlobals } from 'global/network_globals'

import { Message, DataMap } from 'message'
import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { NetworkMessage, NetworkMessageType, NetworkProp } from 'message/network_message'

import { ChannelType } from 'network/api'

import { settings } from 'settings'

import { SeqMap } from 'util/seq_map'

export class Runner extends SystemBase implements System  {
	private static readonly _maxFrameMillis = 33;

	private _rollbackBuffer : SeqMap<number, DataMap>;
	private _stepTimes : SeqMap<number, number>;
	private _seqNum : number;
	private _importSeqNum : number;
	private _updateSpeed : number;

	constructor() {
		super(SystemType.RUNNER);

		this.setName({
			base: "runner",
		});

		this._rollbackBuffer = new SeqMap(NetworkGlobals.rollbackBufferSize);
		this._stepTimes = new SeqMap(NetworkGlobals.rollbackBufferSize);
		this._seqNum = 0;
		this._importSeqNum = 0;
		this._updateSpeed = 1.0;

		this.addProp<number>({
			export: () => { return this._updateSpeed; },
			import: (obj : number) => { this._updateSpeed = obj; },
		});
	}

	override ready() : boolean { return super.ready() && game.hasClientId(); }

	override initialize() : void {
		super.initialize();

		this._rollbackBuffer.insert(this._seqNum, {});
		this._stepTimes.insert(this._seqNum, Date.now());
	}

	push<T extends System>(system : T) : void {
		if (this.hasChild(system.type())) {
			console.error("Error: skipping duplicate system with type %d, name %s", system.type(), system.name());
			return;
		}
		this.registerChild(system.type(), system);
	}

	getSystem<T extends System>(type : SystemType) : T { return this.getChild<T>(type); }

	seqNum() : number { return this._seqNum; }
	importSeqNum() : number { return this._importSeqNum; }
	setUpdateSpeed(speed : number) : void { this._updateSpeed = speed; }

	// TODO: pass in frame rate or expected millis?
	step() : void {
		if (!this.initialized()) {
			if (!this.ready()) {
				return;
			}
			this.initialize();
		}
		this._rollbackBuffer.insert(this._seqNum, this.toDataMap());

		// TODO: cleanup, add limits
		let rollbackFrames = 0; // Math.min(2, this._seqNum - 2);
		if (!this.isHost()) {
			if (settings.enablePrediction) {
				rollbackFrames = Math.min(20, game.keys().framesSinceChange());
			}
		}

		let baseSeqNum = this._seqNum - rollbackFrames;
		if (rollbackFrames > 0) {
			let [data, ok] = this._rollbackBuffer.get(baseSeqNum);
			if (ok) {
				this.rollback(data, baseSeqNum);
			} else {
				console.error("Warning: failed to rollback %d frames to %d", rollbackFrames, baseSeqNum);
				baseSeqNum = this._seqNum;
			}	
		}


		const frames = this._seqNum - baseSeqNum;
		let [baseTime, ok] = this._stepTimes.get(baseSeqNum);
		if (!ok) {
			console.error("Warning: missing step time for frame %d", baseSeqNum);
		}
		let totalTime = ok ? (Date.now() - baseTime) : 16 * frames;

		if (rollbackFrames > 0) {
			console.log("Simulate %d to %d, %d frames, %d rb frames, millis: %d", baseSeqNum, this._seqNum, frames, rollbackFrames, totalTime);
		}
		for (let seqNum = baseSeqNum + 1; seqNum < this._seqNum; ++seqNum) {
			let syncAdjustment = 1;

			let millis = syncAdjustment * this._updateSpeed * Math.min(totalTime / frames, Runner._maxFrameMillis);
	    	const stepData = {
	    		millis: millis,
	    		seqNum: seqNum,
	    	}
	    	this.preUpdate(stepData);
	    	this.update(stepData);
	    	this.postUpdate(stepData);
	    	this.prePhysics(stepData);
	    	this.physics(stepData);
	    	this.postPhysics(stepData);
		}

		this._seqNum++;
		this._stepTimes.insert(this._seqNum, Date.now());
		let [lastTime, _] = this._stepTimes.get(this._seqNum - 1);
		const stepData = {
			millis: Date.now() - lastTime,
			seqNum: this._seqNum,
		}
    	this.preUpdate(stepData);
    	this.update(stepData);
    	this.postUpdate(stepData);
    	this.prePhysics(stepData);
    	this.physics(stepData);
    	this.postPhysics(stepData);
    	this.preRender();
    	this.render();
    	this.postRender();

    	this.updateData(this._seqNum);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (!this.isSource()) {
			return;
		}

		switch(msg.type()) {
		case GameMessageType.NEW_CLIENT:
		case GameMessageType.LEVEL_LOAD:
			const connection = game.netcode();
			const [initMessage, has] = this.message(DataFilter.INIT);
			if (has) {
				connection.broadcast(ChannelType.TCP, initMessage);
			}
			break;
		}
	}

	override importData(data : DataMap, seqNum : number) : void {
		this._importSeqNum = Math.max(this._importSeqNum, seqNum);
		this._seqNum = Math.max(this._seqNum, this._importSeqNum);	
		super.importData(data, seqNum);

		/*
		if (this.isSource()) {
			return;
		}
		*/


		let [currentData, ok] = this._rollbackBuffer.get(seqNum);
		if (ok) {
			// Merge into already existing data
			this._rollbackBuffer.insert(seqNum, {...currentData, ...data});
		} else {
			/*
			// Find previous data to merge into or add new entry
			let [prev, hasPrev] = this._rollbackBuffer.prev(seqNum);
			if (hasPrev) {
				let [prevData, _] = this._rollbackBuffer.get(prev); 
				this._rollbackBuffer.insert(seqNum, {...prevData, ...data});
			} else {
				this._rollbackBuffer.insert(seqNum, data);
			}
			*/
		}

		// Merge into any future data
		/*
		let [next, hasNext] = this._rollbackBuffer.next(seqNum);
		while (hasNext) {
			let [nextData, _] = this._rollbackBuffer.get(next);
			this._rollbackBuffer.insert(seqNum, {...data, ...nextData});

			[next, hasNext] = this._rollbackBuffer.next(seqNum);
		}
		*/
	}

	message(filter : DataFilter) : [NetworkMessage, boolean] {
		const [data, has] = this.dataMap(filter, this._seqNum);
		if (!has) {
			return [null, false];
		}

		let msg = new NetworkMessage(NetworkMessageType.GAME);
		msg.setProp<number>(NetworkProp.SEQ_NUM, this._seqNum)
			.setProp<Object>(NetworkProp.DATA, data);
		return [msg, true];
	}
}