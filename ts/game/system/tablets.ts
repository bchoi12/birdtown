
import { game } from 'game'
import { StepData } from 'game/game_object'
import { System, ClientSystemManager } from 'game/system'
import { SystemType, ScoreType } from 'game/system/api'
import { Tablet } from 'game/system/tablet'

import { defined } from 'util/common'

export class Tablets extends ClientSystemManager implements System {

	constructor() {
		super(SystemType.TABLETS);

		this.setFactoryFn((clientId : number) => { return this.addTablet(new Tablet(clientId)); })
	}

	addTablet(tablet : Tablet) : Tablet { return this.registerChild<Tablet>(tablet.clientId(), tablet); }
	hasTablet(clientId : number) : boolean { return this.hasChild(clientId); }
	getTablet(clientId? : number) : Tablet { return this.getChild<Tablet>(defined(clientId) ? clientId : game.clientId()); }

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);

		this.executeIf<Tablet>((tablet : Tablet) => {
			tablet.setTotalScore(tablet.score(ScoreType.KILL));
		}, (tablet : Tablet) => {
			return tablet.totalChanged();
		});
	}
}