
import { game } from 'game'
import { ClientSystem, System, SystemType } from 'game/system'
import { LevelLoadMsg } from 'game/system/api'

import { ui } from 'ui'

enum SetupState {
	UNKNOWN,
	WAITING,
	READY,
}

export class ClientState extends ClientSystem implements System {

	private _displayName : string;
	private _setupState : SetupState;
	private _levelVersion : number;

	constructor(gameId : number) {
		super(SystemType.CLIENT_STATE, gameId);

		this.setName({
			base: "client_state",
			id: gameId,
		});

		this._displayName = "";
		this._setupState = SetupState.UNKNOWN;
		this._levelVersion = 0;

		this.addProp<string>({
			has: () => { return this.hasDisplayName(); },
			export: () => { return this._displayName; },
			import: (obj: string) => { this._displayName = obj; },
		});
		this.addProp<SetupState>({
			has: () => { return this.setupState() !== SetupState.UNKNOWN; },
			export: () => { return this.setupState(); },
			import: (obj : SetupState) => { this.setSetupState(obj); },
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

	setup() : boolean { return this._setupState === SetupState.READY; }
	setupState() : SetupState { return this._setupState; }
	requestSetupState() : void { this.setSetupState(SetupState.WAITING); }
	setSetupState(setupState : SetupState) : void {
		if (this._setupState === setupState) {
			return;
		}

		this._setupState = setupState;

		if (!this.isSource()) {
			return;
		}

		switch(this._setupState) {
		case SetupState.WAITING:
			ui.pushDialog(() => {
				this.setSetupState(SetupState.READY);
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