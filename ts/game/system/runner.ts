import { game } from 'game'
import { System, SystemBase, SystemType } from 'game/system'
import { LevelLoadMsg, LevelType, NewClientMsg } from 'game/system/api'
import { DuelMode } from 'game/system/game_mode/duel_mode'

import { Message, MessageType } from 'network/api'

import { ChannelType } from 'network/netcode'
import { Data, DataFilter, DataMap } from 'network/data'

export class Runner extends SystemBase implements System  {
	private static readonly _maxFrameMillis = 32;

	private _seqNum : number;
	private _updateSpeed : number;

	constructor() {
		super(SystemType.RUNNER);

		this.setName({
			base: "runner",
		});

		this._seqNum = 0;
		this._updateSpeed = 1.0;

		this.addProp<number>({
			export: () => { return this._seqNum; },
			import: (obj : number) => { this._seqNum = obj; },
			options: {
				optional: true,
			},
		});
		this.addProp<number>({
			export: () => { return this._updateSpeed; },
			import: (obj : number) => { this._updateSpeed = obj; },
		});

		this.setFactoryFn((type : number) => {
			if (type === SystemType.DUEL_MODE) {
				return new DuelMode();
			}
		})
	}

	override ready() : boolean { return super.ready() && game.hasId(); }

	push<T extends System>(system : T) : T {
		if (this.hasChild(system.type())) {
			console.error("Error: skipping duplicate system with type %d, name %s", system.type(), system.name());
			return;
		}

		this.addChild(system.type(), system);
		return system;
	}

	getSystem<T extends System>(type : SystemType) : T { return this.getChild<T>(type); }

	setUpdateSpeed(speed : number) : void { this._updateSpeed = speed; }

	run() : void {
		if (!this.initialized()) {
			if (!this.ready()) {
				return;
			}

			this.initialize();
		}

		if (this.isSource()) {
			this._seqNum++;
		}

    	const millis = Math.min(this.millisSinceUpdate(), Runner._maxFrameMillis) * this._updateSpeed;
    	this.preUpdate(millis);
    	this.update(millis);
    	this.postUpdate(millis);
    	this.prePhysics(millis);
    	this.physics(millis);
    	this.postPhysics(millis);
    	this.preRender(millis);
    	this.render(millis);
    	this.postRender(millis);

    	this.updateData(this._seqNum);
	}

	override onNewClient(msg : NewClientMsg) : void {
		super.onNewClient(msg);

		if (this.isSource()) {
			const connection = game.netcode();
			const [msg, has] = this.message(DataFilter.INIT);
			if (has) {
				connection.broadcast(ChannelType.TCP, msg);
			}
		}
	}

	override onLevelLoad(msg : LevelLoadMsg) : void {
		super.onLevelLoad(msg);

		if (this.isSource()) {
			const connection = game.netcode();
			const [msg, has] = this.message(DataFilter.INIT);
			if (has) {
				connection.broadcast(ChannelType.TCP, msg);
			}
		}
	}

	message(filter : DataFilter) : [Message, boolean] {
		const [data, has] = this.dataMap(filter, this._seqNum);
		if (!has) {
			return [null, false];
		}

		return [{
			T: MessageType.GAME,
			S: this._seqNum,
			D: data,
		}, true];
	}
}