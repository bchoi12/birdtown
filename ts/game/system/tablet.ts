
import { game } from 'game'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'
import { ClientSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { AnnouncementType, FeedType, InfoType } from 'ui/api'

import { Optional } from 'util/optional'

export class Tablet extends ClientSystem implements System {

/*
export enum InfoType {
	UNKNOWN,

	DEATHS,
	LIVES,
	KILLS,
	NAME,
	PING,
	SCORE,
}
*/

	private static readonly _roundResetTypes = new Set([
		InfoType.DEATHS,
		InfoType.KILLS,
		InfoType.LIVES,
		InfoType.SCORE,
	]);

	private static readonly _displayNameMaxLength = 16;

	private _color : string;
	private _displayName : string;
	private _infoMap : Map<InfoType, number>;

	constructor(clientId : number) {
		super(SystemType.TABLET, clientId);

		this._color = "";
		this._displayName = "";
		this._infoMap = new Map();

		this.resetRound();

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

		for (const stringScore in InfoType) {
			const scoreType = Number(InfoType[stringScore]);
			if (Number.isNaN(scoreType) || scoreType <= 0) {
				continue;
			}

			this.addProp<number>({
				has: () => { return this.hasInfo(scoreType); },
				export: () => { return this.getInfo(scoreType); },
				import: (obj : number) => { this.setInfo(scoreType, obj); },
			})
		}
	}

	override reset() : void {
		super.reset();

		this._infoMap.clear();
		this.resetRound();
	}
	resetRound() : void {
		Tablet._roundResetTypes.forEach((type : InfoType) => {
			this.setInfo(type, 0);
		});
	}

	override delete() : void {
		super.delete();

		if (this.hasDisplayName()) {
	    	let msg = new GameMessage(GameMessageType.FEED);
	    	msg.setNames([this.displayName()]);
	    	msg.setFeedType(FeedType.LEAVE);
	    	game.announcer().broadcast(msg);
		}
	}

	isSetup() : boolean { return this.hasDisplayName() && !this.deleted(); }

	infoMap() : Map<InfoType, number> { return this._infoMap; }
	getInfo(type : InfoType) : number { return this.hasInfo(type) ? this._infoMap.get(type) : 0; }
	hasInfo(type : InfoType) : boolean { return this._infoMap.has(type); }
	setInfo(type : InfoType, value : number) : void {
		this._infoMap.set(type, value);

		ui.updateInfo(this.clientId(), type, value);

		if (type === InfoType.KILLS) {
			this.setInfo(InfoType.SCORE, value);
		}
	}
	addInfo(type : InfoType, delta : number) : void {
		this.setInfo(type, (this.hasInfo(type) ? this.getInfo(type) : 0) + delta);
	}
	clearInfo(type : InfoType) : void {
		this._infoMap.delete(type);
		ui.clearInfo(this.clientId(), type);
	}

	outOfLives() : boolean { return this.hasInfo(InfoType.LIVES) && this.getInfo(InfoType.LIVES) <= 0; }
	loseLife() : void {
		this.addInfo(InfoType.DEATHS, 1);		

		if (!this.hasInfo(InfoType.LIVES)) {
			return;
		}
		if (this.outOfLives()) {
			console.error("Error: lost a life at when out of lives for %s", this.name());
			return;
		}
		this.addInfo(InfoType.LIVES, -1);
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

		// Announce new players and self.
		const announce = !this.hasDisplayName() && game.clientId() <= this.clientId();
		this._displayName = displayName;
		this.addNameParams({
			type: this.displayName(),
		});

		if (announce) {
	    	let msg = new GameMessage(GameMessageType.FEED);
	    	msg.setNames([this.displayName()]);
	    	msg.setFeedType(FeedType.JOIN);
	    	game.announcer().broadcast(msg);
		}

		const initMsg = new GameMessage(GameMessageType.CLIENT_INIT);
		initMsg.setClientId(this.clientId());
		initMsg.setDisplayName(this.displayName());
		ui.handleMessage(initMsg);

		ui.updateInfo(this.clientId(), InfoType.NAME, this.displayName());
	}
	hasDisplayName() : boolean { return this._displayName.length > 0; }
	displayName() : string { return (this.hasDisplayName() ? this._displayName : "unknown") + " #" + this.clientId(); }
}