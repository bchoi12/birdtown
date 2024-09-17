
import { game } from 'game'
import { GameState } from 'game/api'
import { StepData } from 'game/game_object'
import { System, ClientSystemManager } from 'game/system'
import { SystemType } from 'game/system/api'
import { Tablet } from 'game/system/tablet'

import { GameMessage, GameMessageType} from 'message/game_message'

import { defined } from 'util/common'

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
	tablet(clientId? : number) : Tablet { return this.getChild<Tablet>(defined(clientId) ? clientId : game.clientId()); }
}