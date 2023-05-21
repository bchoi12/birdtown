
import { game } from 'game'
import { ClientSystem, System } from 'game/system'
import { SystemType, LevelLoadMsg } from 'game/system/api'

import { ui } from 'ui'
import { DialogType } from 'ui/api'

enum SetupState {
	UNKNOWN,
	WAITING,
	READY,
}

export class ClientState extends ClientSystem implements System {

	private _displayName : string;

	// TODO: change this to a counter / version?
	private _setupState : SetupState;

	constructor(gameId : number) {
		super(SystemType.CLIENT_STATE, gameId);

		this.setName({
			base: "client_state",
			id: gameId,
		});

		this._displayName = "";
		this._setupState = SetupState.UNKNOWN;

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
			ui.pushDialog({
				type: DialogType.CHECK_READY,
				onSubmit: () => {
					this.setSetupState(SetupState.READY);
				},
			});
			break;
		}
	}
}