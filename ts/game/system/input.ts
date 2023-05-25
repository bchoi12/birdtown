
import { game } from 'game'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { Keys } from 'game/system/keys'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { defined } from 'util/common'

export class Input extends SystemBase implements System {

	private _keys : Map<number, Keys>;

	constructor() {
		super(SystemType.INPUT);

		this.setName({
			base: "input",
		});

		this.setFactoryFn((clientId : number) => { return this.addKeys(new Keys(clientId)); })

		this._keys = new Map();
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.NEW_CLIENT) {
			return;
		}

		const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
		this.getFactoryFn()(clientId);
	}

	addKeys(keys : Keys) : Keys { return this.registerChild(keys.clientId(), keys); }
	hasKeys(clientId : number) : boolean { return this.hasChild(clientId); }
	getKeys(clientId? : number) : Keys {
		clientId = defined(clientId) ? clientId : game.clientId();
		return this.getChild<Keys>(clientId);
	}
}