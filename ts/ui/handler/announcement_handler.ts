
import { game } from 'game'
import { SoundType } from 'game/factory/api'
import { SoundFactory } from 'game/factory/sound_factory'

import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

type AnnouncementHTML = {
	main : string;
	sub? : string;
}

export class AnnouncementHandler extends HandlerBase implements Handler {

	private static readonly _defaultTTL : number = 3000;

	private _active : boolean;
	private _announcementElm : HTMLElement;
	private _mainAnnouncementElm : HTMLElement;
	private _subAnnouncementElm : HTMLElement;
	private _announcements : Array<GameMessage>;

	constructor() {
		super(HandlerType.ANNOUNCEMENT);

		this._active = false;
		this._announcementElm = Html.elm(Html.divAnnouncement);
		this._mainAnnouncementElm = Html.elm(Html.divMainAnnouncement);
		this._subAnnouncementElm = Html.elm(Html.divSubAnnouncement);
		this._announcements = new Array<GameMessage>();
	}

	override reset() : void {
		super.reset();

		this._announcementElm.style.visibility = "hidden";
		this._announcements = [];
		this._active = false;
	}

	override clear() : void {
		super.clear();

		this.reset();
	}

	pushAnnouncement(msg : GameMessage) : void {
		if (msg.type() !== GameMessageType.ANNOUNCEMENT) {
			return;
		}

		this._announcements.push(msg);
		if (!this._active) {
			this.popAnnouncement();
		}
	}

	private popAnnouncement() {
		if (this._announcements.length === 0) {
			this._announcementElm.style.visibility = "hidden";
			this._active = false;
			return;
		}

		const announcement = this._announcements.shift();
		const htmls = this.getHtmls(announcement);
		this._mainAnnouncementElm.innerHTML = htmls.main;
		this._subAnnouncementElm.innerHTML = htmls.sub ? htmls.sub : "";
		this._announcementElm.style.visibility = "visible";
		this._active = true;

		let timeout = announcement.getTtlOr(AnnouncementHandler._defaultTTL); 
		setTimeout(() => {
			this.popAnnouncement();
		}, timeout);
	}

	private getHtmls(msg : GameMessage) : AnnouncementHTML {
		const type = msg.getAnnouncementType();
		const names = msg.getNamesOr([]);

		switch (type) {
		case AnnouncementType.GAME_END:
			return {
				main: "Current game has been terminated",
				sub: "Returning all players to the lobby",
			};
		case AnnouncementType.GAME_ERROR:
			return {
				main: names.length === 1 ? names[0] : "An unexpected error occurred...",
				sub: "Returning all players to the lobby",
			};
		case AnnouncementType.GAME_FINISH:
			if (names.length <= 0) {
				return {
					main: "It's a draw?!",
				}
			}
			return {
				main: names.join(", ") + " wins the round!",
			};
		case AnnouncementType.GAME_SELECTED:
			if (names.length < 2) {
				return {
					main: "Game mode has been selected",
				};
			}
			return {
				main: `${names[0]} is setting up ${names[1]}`
			}
		case AnnouncementType.GAME_STARTING:
			return {
				main: (names.length === 1 ? names[0] : "Game") + " starting soon!"
			};
		case AnnouncementType.GAME_VICTORY:
			if (names.length <= 0) {
				return {
					main: "No one won?!",
				}
			}
			return {
				main: "AND " + names.join(", ").toUpperCase() + (names.length > 1 ? " WIN" : " WINS") + " IT ALL!",
			};
		case AnnouncementType.GENERIC:
			return {
				main: names.length >= 1 ? names[0] : "",
				sub: names.length >= 2 ? names[1] : "",
			}
		case AnnouncementType.LEVEL:
			if (names.length === 1) {
				return {
					main: "Welcome to " + names[0],
				};
			}
			break;
		case AnnouncementType.PLAYER_JOINED:
			if (names.length === 1) {
				return {
					main: names[0] + " just joined!",
					sub: this.numPlayersMessage(),
				}
			}
			break;
		case AnnouncementType.PLAYER_LEFT:
			if (names.length === 1) {
				return {
					main: names[0] + " disconnected",
					sub: this.numPlayersMessage(),
				}
			}
			break;
		case AnnouncementType.WELCOME:
			if (names.length === 1) {
				return {
					main: "Welcome " + names[0] + "!",
					sub: this.numPlayersMessage(),
				}
			}

		}

		return {
			main: "Something bad happened",
			sub: "type: " + AnnouncementType[type],
		};
	}

	private numPlayersMessage() : string {
		const players = game.tablets().numSetup();
		return players === 1
			? "You\'re the only one here"
			: "There are currently " + players + " players";
	}
}