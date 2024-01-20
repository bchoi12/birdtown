
import { StepData } from 'game/game_object'
import { ClientSystem, System } from 'game/system'
import { SystemType, ScoreType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'

export class Tablet extends ClientSystem implements System {

	private _roundScore : number;

	private _displayName : string;
	private _scores : Map<ScoreType, number>;
	private _scoreChanged : boolean;

	constructor(clientId : number) {
		super(SystemType.TABLET, clientId);

		this._roundScore = 0;
		this._displayName = "";
		this._scores = new Map();
		this._scoreChanged = false;

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

		this._roundScore = 0;
		this._scores.forEach((score : number, type : ScoreType) => {
			this._scores.set(type, 0);
		});
	}

	scoreChanged() : boolean { return this._scoreChanged; }
	roundScore() : number { return this._roundScore; }
	setRoundScore(value : number) : void {
		this._roundScore = value;
		this._scoreChanged = false;
	}

	scores() : Map<ScoreType, number> { return this._scores; }
	score(type : ScoreType) : number { return this.hasScore(type) ? this._scores.get(type) : 0; }
	hasScore(type : ScoreType) : boolean { return this._scores.has(type); }
	setScore(type : ScoreType, value : number) : void {
		this._scores.set(type, value);
		this._scoreChanged = true;
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
	hasDisplayName() : boolean { return this._displayName.length > 0; }
	displayName() : string { return this.hasDisplayName() ? this._displayName : "unknown"; }
}