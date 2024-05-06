
import { game } from 'game'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'
import { ClientSystem, System } from 'game/system'
import { SystemType, ScoreType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

export class Tablet extends ClientSystem implements System {

	private static readonly _displayNameMaxLength = 16;

	private _roundScore : number;

	private _displayName : string;
	private _color : string;
	private _scores : Map<ScoreType, number>;
	private _scoreChanged : boolean;

	constructor(clientId : number) {
		super(SystemType.TABLET, clientId);

		this._roundScore = 0;
		this._displayName = "";
		this._color = "";
		this._scores = new Map();
		this._scoreChanged = false;

		this.addProp<string>({
			has: () => { return this._displayName.length > 0; },
			export: () => { return this._displayName; },
			import: (obj: string) => { this.setDisplayName(obj); },
		});

		this.addProp<string>({
			has: () => { return this._color.length > 0; },
			export: () => { return this._color; },
			import: (obj: string) => { this.setColor(obj); },
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

	override delete() : void {
		super.delete();

		if (this.hasDisplayName()) {
    		let announcementMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
    		announcementMsg.setAnnouncementType(AnnouncementType.PLAYER_LEFT);
    		announcementMsg.setNames([this.displayName()]);
	    	ui.handleMessage(announcementMsg);			
		}
	}

	isSetup() : boolean { return this.hasDisplayName() && !this.deleted(); }

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

	hasColor() : boolean { return this._color.length > 0; }
	setColor(color : string) : void {
		if (color.length === 0) {
			console.error("Error: trying to set empty color");
		}

		this._color = color;
	}
	color() : string { return this.hasColor() ? this._color : ColorFactory.playerColor(this.clientId()).toString(); }

	setDisplayName(displayName : string) : void {
		if (displayName.length === 0) {
			console.error("Error: skipping empty display name");
			return;
		}

		if (displayName.length > Tablet._displayNameMaxLength) {
			displayName = displayName.substring(0, Tablet._displayNameMaxLength);
		}

		// Announce new players and welcome self.
		const announce = !this.hasDisplayName() && game.clientId() <= this.clientId();
		this._displayName = displayName;
		this.addNameParams({
			type: this.displayName(),
		});

		if (announce) {
	    	let announcementMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
	    	if (this.clientIdMatches()) {
	    		announcementMsg.setAnnouncementType(AnnouncementType.WELCOME);
	    	} else {
		    	announcementMsg.setAnnouncementType(AnnouncementType.PLAYER_JOINED);
	    	}
	    	announcementMsg.setNames([this.displayName()]);
	    	ui.handleMessage(announcementMsg);
		}

		const initMsg = new UiMessage(UiMessageType.CLIENT_INIT);
		initMsg.setClientId(this.clientId());
		initMsg.setDisplayName(this.displayName());
		ui.handleMessage(initMsg);
	}
	hasDisplayName() : boolean { return this._displayName.length > 0; }
	displayName() : string { return (this.hasDisplayName() ? this._displayName : "unknown") + " #" + this.clientId(); }
}