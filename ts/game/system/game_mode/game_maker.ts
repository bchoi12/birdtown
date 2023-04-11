
import { System, SystemBase, SystemType } from 'game/system'

export interface GameMaker {
	canSetup() : boolean;
	querySetup() : boolean;
	setup() : void;
	
	canStart() : boolean;
	queryStart() : boolean;
	start() : void;

	canFinish() : boolean;
	queryFinish() : boolean;
	finish() : void;
}

// TODO: probably doesn't have to be a system
export abstract class GameMakerBase extends SystemBase implements GameMaker {
	
	constructor(type : SystemType) {
		super(type);
	}

	abstract canSetup() : boolean;
	abstract querySetup() : boolean;
	setup() : void {}

	abstract canStart() : boolean;
	abstract queryStart() : boolean;
	start() : void {}

	abstract canFinish() : boolean;
	abstract queryFinish() : boolean;
	finish() : void {}
}