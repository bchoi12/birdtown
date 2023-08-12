
import { GameState } from 'game/api'

export interface GameMaker {
	queryAdvance(currentState : GameState) : boolean;
	canAdvance(currentState : GameState) : boolean;
	onStateChange(state : GameState) : void;
}

export abstract class GameMakerBase implements GameMaker {

	abstract queryAdvance(currentState : GameState) : boolean;
	abstract canAdvance(currentState : GameState) : boolean;
	abstract onStateChange(state : GameState) : void;
}