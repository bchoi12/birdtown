
import { game } from 'game'
import { GameState } from 'game/api'
import { StepData } from 'game/game_object'
import { System, ClientSystemManager } from 'game/system'
import { SystemType, ScoreType } from 'game/system/api'
import { Tablet } from 'game/system/tablet'

import { GameMessage, GameMessageType} from 'message/game_message'

import { defined } from 'util/common'

type Score = {
	displayName : string;
	roundScore : number;
	scores : Map<ScoreType, number>;
}

export class Tablets extends ClientSystemManager implements System {

	constructor() {
		super(SystemType.TABLETS);

		this.setFactoryFn((clientId : number) => { return this.addTablet(new Tablet(clientId)); })
	}

	numSetup() : number {
		return this.findAll((tablet : Tablet) => {
			return tablet.isSetup();
		}).length;
	}
	addTablet(tablet : Tablet) : Tablet { return this.registerChild<Tablet>(tablet.clientId(), tablet); }
	hasTablet(clientId : number) : boolean { return this.hasChild(clientId); }
	getTablet(clientId? : number) : Tablet { return this.getChild<Tablet>(defined(clientId) ? clientId : game.clientId()); }

	scores() : Array<Score> {
		return this.mapAll<Tablet, Score>((tablet : Tablet) => {
			return {
				displayName: tablet.displayName(),
				roundScore: tablet.roundScore(),
				scores: tablet.scores(),
			}
		});
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.GAME_STATE:
			switch (msg.getGameState()) {
			case GameState.FREE:
			case GameState.SETUP:
				this.reset();
				break;
			}
			break;
		}
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);

		this.executeIf<Tablet>((tablet : Tablet) => {
			tablet.setRoundScore(tablet.score(ScoreType.KILL));
		}, (tablet : Tablet) => {
			return tablet.scoreChanged();
		});
	}
}