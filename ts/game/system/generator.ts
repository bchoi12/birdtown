
import { SystemBase, System } from 'game/system'
import { SystemType, LevelType, LevelLayout } from 'game/system/api'

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

		this.cleanUp(msg.getLevelType(), msg.getLevelLayout());
		this.generate(msg.getLevelType(), msg.getLevelLayout(), msg.getLevelSeed());
	}

	abstract cleanUp(type : LevelType, layout : LevelLayout) : void;
	abstract generate(type : LevelType, layout : LevelLayout, seed : number) : void;
}