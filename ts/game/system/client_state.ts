
import { game } from 'game'
import { ClientSystem, System, SystemType } from 'game/system'
import { LevelLoadMsg } from 'game/system/api'

import { ui } from 'ui'

// TODO: change to SetupState
enum ReadyState {
	UNKNOWN,
	WAITING,
	READY,
}

export class ClientState extends ClientSystem implements System {

	private _displayName : string;
	private _readyState : ReadyState;
	private _levelVersion : number;

	constructor(gameId : number) {
		super(SystemType.CLIENT_STATE, gameId);

		this.setName({
			base: "client_state",
			id: gameId,
		});

		this._displayName = "";
		this._readyState = ReadyState.UNKNOWN;
		this._levelVersion = 0;

		this.addProp<string>({
			has: () => { return this.hasDisplayName(); },
			export: () => { return this._displayName; },
			import: (obj: string) => { this._displayName = obj; },
		});
		this.addProp<ReadyState>({
			has: () => { return this.readyState() !== ReadyState.UNKNOWN; },
			export: () => { return this.readyState(); },
			import: (obj : ReadyState) => { this.setReadyState(obj); },
		});
		this.addProp<number>({
			has: () => { return this._levelVersion > 0; },
			export: () => { return this._levelVersion; },
			import: (obj: number) => { this._levelVersion = obj; },
		});
	}

	override ready() : boolean { return super.ready() && this.hasDisplayName(); }
	override initialize() : void {
		super.initialize();

		ui.onNewClient({
			gameId: this.gameId(),
			isSelf: game.id() === this.gameId(),
			displayName: this.displayName(),
		});
	}

	private hasDisplayName() : boolean { return this._displayName.length > 0; }
	setDisplayName(name : string) : void { this._displayName = name; }
	displayName() : string { return this._displayName; }

	levelVersion() : number { return this._levelVersion; }

	// TODO: rename or remove prepared() method
	prepared() : boolean { return this._readyState === ReadyState.READY; }
	readyState() : ReadyState { return this._readyState; }
	requestReadyState() : void { this.setReadyState(ReadyState.WAITING); }
	setReadyState(readyState : ReadyState) : void {
		if (this._readyState === readyState) {
			return;
		}

		this._readyState = readyState;

		if (!this.isSource()) {
			return;
		}

		switch(this._readyState) {
		case ReadyState.WAITING:
			ui.pushDialog(() => {
				this.setReadyState(ReadyState.READY);
			});
			break;
		}
	}

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