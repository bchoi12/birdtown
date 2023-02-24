import { System, SystemBase, SystemType } from 'game/system'

export class ClientInfo extends SystemBase implements System {

	private _gameId;

	constructor(gameId : number) {
		super(SystemType.CLIENT_INFO);

		this.setName({
			base: "client_info",
		});

		this._gameId = gameId;
	}

	gameId() : number { return this._gameId; }
}