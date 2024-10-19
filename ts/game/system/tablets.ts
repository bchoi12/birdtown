
import { game } from 'game'
import { GameState } from 'game/api'
import { StepData } from 'game/game_object'
import { System, ClientSystemManager } from 'game/system'
import { SystemType } from 'game/system/api'
import { Tablet } from 'game/system/tablet'

import { GameMessage, GameMessageType} from 'message/game_message'

import { InfoType } from 'ui/api'

import { defined } from 'util/common'

export class Tablets extends ClientSystemManager implements System {

	private static readonly _numTeams = 2;

	private _teamScores : Map<number, number>;

	constructor() {
		super(SystemType.TABLETS);

		this._teamScores = new Map();

		this.setFactoryFn((clientId : number) => { return this.addTablet(new Tablet(clientId)); })
	}

	updateTeamScores() : void {
		this._teamScores.clear();
		this.execute((tablet : Tablet) => {
			const team = tablet.team();
			if (!this._teamScores.has(team)) {
				this._teamScores.set(team, 0);
			}
			this._teamScores.set(team, this._teamScores.get(team) + tablet.getInfo(InfoType.SCORE));
		});
	}
	teamScores() : Map<number, number> { return this._teamScores; }

	numSetup() : number {
		return this.findAll((tablet : Tablet) => {
			return tablet.isSetup();
		}).length;
	}
	addTablet(tablet : Tablet) : Tablet { return this.registerChild<Tablet>(tablet.clientId(), tablet); }
	hasTablet(clientId : number) : boolean { return this.hasChild(clientId); }
	tablet(clientId? : number) : Tablet { return this.getChild<Tablet>(defined(clientId) ? clientId : game.clientId()); }
}