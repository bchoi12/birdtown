
import { game } from 'game'
import { LevelLoadMsg, ClientSystem, System, SystemType } from 'game/system'

import { ui } from 'ui'

enum ReadyState {
	UNKNOWN,
	WAITING,
	READY,
}

export class ClientState extends ClientSystem implements System {

	private _connectionName : string;
	private _displayName : string;
	private _readyState : ReadyState;
	private _levelVersion : number;
	private _voiceEnabled : boolean;

	constructor(gameId : number) {
		super(SystemType.CLIENT_STATE, gameId);

		this.setName({
			base: "client_state",
			id: gameId,
		});

		this._connectionName = "";
		this._displayName = "";
		this._readyState = ReadyState.UNKNOWN;
		this._levelVersion = 0;
		this._voiceEnabled = false;

		this.addProp<string>({
			has: () => { return this.hasConnectionName(); },
			export: () => { return this._connectionName; },
			import: (obj: string) => { this._connectionName = obj; },
		});
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
		this.addProp<boolean>({
			export: () => { return this._voiceEnabled; },
			import: (obj : boolean) => { this.setVoiceEnabled(obj); },
		})
	}

	override ready() : boolean { return super.ready() && this.hasDisplayName(); }
	override initialize() : void {
		super.initialize();

		ui.onNewClient({
			isSelf: game.id() === this.gameId(),
			displayName: this.displayName(),
		});
	}

	private hasConnectionName() : boolean { return this._connectionName.length > 0; }
	setConnectionName(name : string) : void { this._connectionName = name; }
	connectionName() : string { return this._connectionName; }

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

	voiceEnabled() : boolean { return this._voiceEnabled; }
	setVoiceEnabled(enabled : boolean) : void {
		if (this._voiceEnabled === enabled) {
			return;
		}

		this._voiceEnabled = enabled;

		if (this.isSource()) {
			ui.setVoiceEnabled(this._voiceEnabled);
		}

		// TODO: game.id() is larger than ID, call peer
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