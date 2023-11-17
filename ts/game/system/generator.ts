
import { SystemBase, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'

export abstract class Generator extends SystemBase implements System {

	constructor(type : SystemType) {
		super(type);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.LEVEL_LOAD) {
			return;
		}

		this.generate(msg.getLevelSeed());
	}

	abstract generate(seed : number) : void;
}