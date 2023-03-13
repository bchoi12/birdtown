import { LevelLoadMsg, ClientSystem, System, SystemType } from 'game/system'

export class ClientState extends ClientSystem implements System {

	private _displayName : string;
	private _levelVersion : number;

	constructor(gameId : number) {
		super(SystemType.CLIENT_STATE, gameId);

		this.setName({
			base: "client_state",
			id: gameId,
		});

		this._displayName = "";
		this._levelVersion = 0;

		this.addProp<string>({
			has: () => { return this._displayName.length > 0; },
			export: () => { return this._displayName; },
			import: (obj: string) => { this._displayName = obj; },
		});
		this.addProp<number>({
			has: () => { return this._levelVersion > 0; },
			export: () => { return this._levelVersion; },
			import: (obj: number) => { this._levelVersion = obj; },
		});
	}

	setDisplayName(name : string) : void { this._displayName = name; }
	levelVersion() : number { return this._levelVersion; }

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (!this.isHost()) {
			return;
		}
	}

	override onLevelLoad(msg : LevelLoadMsg) : void {
		super.onLevelLoad(msg);

		if (!this.isSource()) {
			return;
		}
		this._levelVersion = msg.version;
	}
}