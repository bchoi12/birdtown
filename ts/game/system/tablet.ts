
import { StepData } from 'game/game_object'
import { ClientSideSystem, System } from 'game/system'
import { SystemType, ScoreType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'

export class Tablet extends ClientSideSystem implements System {

	private _totalScore : number;
	private _displayName : string;
	private _scores : Map<ScoreType, number>;
	private _totalChanged : boolean;

	constructor(clientId : number) {
		super(SystemType.TABLET, clientId);

		this._totalScore = 0;
		this._displayName = "";
		this._scores = new Map();
		this._totalChanged = false;

		this.addProp<string>({
			has: () => { return this._displayName.length > 0; },
			export: () => { return this.displayName(); },
			import: (obj: string) => { this.setDisplayName(obj); },
		});

		for (const stringScore in ScoreType) {
			const scoreType = Number(ScoreType[stringScore]);
			if (Number.isNaN(scoreType) || scoreType <= 0) {
				continue;
			}

			this.addProp<number>({
				has: () => { return this.hasScore(scoreType); },
				export: () => { return this.score(scoreType); },
				import: (obj : number) => { this.setScore(scoreType, obj); },
			})
		}
	}

	override reset() : void {
		super.reset();

		this._totalScore = 0;
		this._scores.forEach((score : number, type : ScoreType) => {
			this._scores.set(type, 0);
		});
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.CLIENT_JOIN:
			const clientId = msg.getClientId();
			if (clientId === this.clientId()) {
				const displayName = msg.getDisplayName();
				this.setDisplayName(displayName);
			}
			break;
		}
	}

	totalChanged() : boolean { return this._totalChanged; }
	totalScore() : number { return this._totalScore; }
	setTotalScore(value : number) : void {
		this._totalScore = value;
		this._totalChanged = false;
	}

	scores() : Map<ScoreType, number> { return this._scores; }
	score(type : ScoreType) : number { return this._scores.get(type); }
	hasScore(type : ScoreType) : boolean { return this._scores.has(type); }
	setScore(type : ScoreType, value : number) : void {
		this._scores.set(type, value);
		this._totalChanged = true;
	}
	addScore(type : ScoreType, delta : number) : void {
		if (!this.hasScore(type)) {
			this.setScore(type, delta);
			return;
		}
		this.setScore(type, (this.hasScore ? this.score(type) : 0) + delta);
	}

	setDisplayName(displayName : string) : void {
		this._displayName = displayName;

		this.addNameParams({
			type: this._displayName,
		});

		const uiMsg = new UiMessage(UiMessageType.CLIENT_JOIN);
		uiMsg.setClientId(this.clientId());
		uiMsg.setDisplayName(this.displayName());
		ui.handleMessage(uiMsg);
	}
	displayName() : string { return this._displayName.length > 0 ? this._displayName : "unknown"; }
}