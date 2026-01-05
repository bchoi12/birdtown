
import { game } from 'game'
import { TeamType } from 'game/component/api'
import { EntityType, BirdType } from 'game/entity/api'
import { ColorType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'
import { ClientSystem, System } from 'game/system'
import { SystemType, WinConditionType } from 'game/system/api'

import { DialogMessage } from 'message/dialog_message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { GameConfigMessage } from 'message/game_config_message'

import { ui } from 'ui'
import { AnnouncementType, DialogType, FeedType, InfoType } from 'ui/api'

import { Optional } from 'util/optional'

export class Tablet extends ClientSystem implements System {

	private static readonly _defaultInfos = new Set([InfoType.WINS, InfoType.KILLS, InfoType.DEATHS]);
	private static readonly _infoSets = new Map<WinConditionType, Set<InfoType>>([
		[WinConditionType.NONE, Tablet._defaultInfos],
		[WinConditionType.LIVES, new Set([InfoType.LIVES, InfoType.VICTORIES, InfoType.KILLS, InfoType.DEATHS])],
		[WinConditionType.POINTS, new Set([InfoType.SCORE, InfoType.VICTORIES, InfoType.KILLS, InfoType.DEATHS])],
		[WinConditionType.TEAM_LIVES, new Set([InfoType.LIVES, InfoType.VICTORIES, InfoType.KILLS, InfoType.DEATHS])],
		[WinConditionType.TEAM_POINTS, new Set([InfoType.SCORE, InfoType.VICTORIES, InfoType.KILLS, InfoType.DEATHS])],
	]);

	private static readonly _roundResetTypes = new Set([
		InfoType.DEATHS,
		InfoType.KILLS,
		InfoType.SCORE,
	]);
	private static readonly _gameResetTypes = new Set([
		...Tablet._roundResetTypes,
		InfoType.LIVES,
		InfoType.VICTORIES,
	]);

	private static readonly _teamColors = new Map<number, string>([
		[TeamType.TEAM_ONE, ColorFactory.toString(ColorType.PLAYER_RED)],
		[TeamType.TEAM_TWO, ColorFactory.toString(ColorType.PLAYER_BLUE)],
	]);
	private static readonly _defaultColor = "#FFFFFF";
	private static readonly _displayNameMaxLength = 16;

	private _birdType : BirdType;
	private _color : string;
	private _displayName : string;
	private _winner : boolean;
	private _infoMap : Map<InfoType, number>;

	constructor(clientId : number) {
		super(SystemType.TABLET, clientId);

		this._birdType = BirdType.UNKNOWN;
		this._color = "";
		this._displayName = "";
		this._winner = false;
		this._infoMap = new Map();

		this.addProp<BirdType>({
			has: () => { return this.hasBirdType(); },
			export: () => { return this._birdType; },
			import: (obj: BirdType) => { this.setBirdType(obj); },
		});
		this.addProp<string>({
			has: () => { return this.hasColor(); },
			export: () => { return this._color; },
			import: (obj: string) => { this.setColor(obj); },
		});
		this.addProp<string>({
			has: () => { return this.hasDisplayName(); },
			export: () => { return this._displayName; },
			import: (obj: string) => { this.setDisplayName(obj); },
		});
		this.addProp<boolean>({
			export: () => { return this._winner; },
			import: (obj : boolean) => { this.setWinner(obj); },
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

	static infoTypes(winCondition : WinConditionType) : Set<InfoType> {
		if (Tablet._infoSets.has(winCondition)) {
			return Tablet._infoSets.get(winCondition);
		}
		return Tablet._defaultInfos;
	}
	resetForGame(msg : GameConfigMessage) : void {
		this.setWinner(false);

		const infoTypes = Tablet.infoTypes(msg.getWinCondition());
		Tablet._gameResetTypes.forEach((type : InfoType) => {
			if (infoTypes.has(type)) {
				this.setInfo(type, 0);
			} else {
				this.clearInfo(type);
			}
		});
	}
	resetForRound(msg : GameConfigMessage) : void {
		this.setWinner(false);

		const infoTypes = Tablet.infoTypes(msg.getWinCondition());
		Tablet._roundResetTypes.forEach((type : InfoType) => {
			if (infoTypes.has(type)) {
				this.setInfo(type, 0);
			}
		});
	}

	override delete() : void {
		super.delete();

		if (this.hasDisplayName()) {
	    	game.announcer().feed({
	    		type: FeedType.LEAVE,
	    		names: [this.displayName()],
	    	});
		}
	}

	isSetup() : boolean { return this.hasDisplayName() && !this.deleted(); }

	infoMap() : Map<InfoType, number> { return this._infoMap; }
	getInfo(type : InfoType) : number { return this.hasInfo(type) ? this._infoMap.get(type) : 0; }
	hasInfo(type : InfoType) : boolean { return this._infoMap.has(type); }
	setInfo(type : InfoType, value : number) : void {
		this._infoMap.set(type, value);

		ui.updateInfo(this.clientId(), type, value);

		if (type === InfoType.SCORE) {
			game.tablets().updateTeamScores();
		}
	}
	addPointKill() : void {
		this.addInfo(InfoType.KILLS, 1);
		this.addInfo(InfoType.SCORE, 1);
	}
	addTeamKill() : void {
		this.addInfo(InfoType.KILLS, 1);
		this.addInfo(InfoType.SCORE, -1);
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

	parseInitMessage(msg : DialogMessage) : void {
		if (msg.type() !== DialogType.INIT) {
			return;
		}

		this.setBirdType(msg.getBirdType());
		this.setColor(msg.getColor());
		this.setDisplayName(msg.getDisplayName());
	}

	hasBirdType() : boolean { return this._birdType !== BirdType.UNKNOWN; }
	setBirdType(type : BirdType) : void { this._birdType = type; }
	birdType() : BirdType { return this._birdType; }

	hasColor() : boolean { return this._color.length > 0; }
	setColor(color : string) : void {
		if (color === null || color.length === 0) {
			console.error("Error: trying to set empty color");
			return;
		}

		this._color = color;
	}
	color() : string {
		const team = this.team();
		if (Tablet._teamColors.has(team)) {
			return Tablet._teamColors.get(team);
		}
		return this.hasColor() ? this._color : Tablet._defaultColor;
	}

	setDisplayName(displayName : string) : void {
		if (displayName.length === 0) {
			console.error("Error: skipping empty display name");
			return;
		}

		if (displayName.length > Tablet._displayNameMaxLength) {
			displayName = displayName.substring(0, Tablet._displayNameMaxLength);
		}

		// Announce new players locally.
		const announce = !this.hasDisplayName() && game.clientId() < this.clientId();
		this._displayName = displayName;
		this.addNameParams({
			type: this.displayName(),
		});

		if (announce) {
	    	let feedMsg = new GameMessage(GameMessageType.FEED);
	    	feedMsg.setNames([this.displayName()]);
	    	feedMsg.setFeedType(FeedType.JOIN);
	    	ui.pushFeed(feedMsg);
		}

		const initMsg = new GameMessage(GameMessageType.CLIENT_INITIALIZED);
		initMsg.setClientId(this.clientId());
		initMsg.setDisplayName(this.displayName());
		ui.handleClientMessage(initMsg);
	}
	hasDisplayName() : boolean { return this._displayName.length > 0; }
	displayName() : string { return this.hasDisplayName() ? `${this._displayName} #${this.clientId()}` : ""; }

	team() : number {
		if (!game.playerStates().hasPlayerState(this.clientId())) {
			return 0;
		}
		return game.playerState(this.clientId()).team();
	}
	setWinner(winner : boolean) : void {
		if (this._winner === winner) {
			return;
		}

		this._winner = winner;

		if (this._winner) {
			ui.highlightPlayer(this.clientId());
		}
	}
}