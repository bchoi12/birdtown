
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

export abstract class GameMakerBase implements GameMaker {
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