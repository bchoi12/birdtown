
import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { AnnouncementType, UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

import { defined } from 'util/common'

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
	private _announcements : Array<UiMessage>;

	constructor() {
		super(HandlerType.ANNOUNCEMENT);

		this._active = false;
		this._announcementElm = Html.elm(Html.divAnnouncement);
		this._mainAnnouncementElm = Html.elm(Html.divMainAnnouncement);
		this._subAnnouncementElm = Html.elm(Html.divSubAnnouncement);
		this._announcements = new Array<UiMessage>();
	}

	override reset() : void { this._announcementElm.style.display = "none"; }

	override handleMessage(msg : UiMessage) : void {
		if (msg.type() !== UiMessageType.ANNOUNCEMENT) {
			return;
		}

		this._announcements.push(msg);
		if (!this._active) {
			this.popAnnouncement();
		}
	}

	private popAnnouncement() {
		if (this._announcements.length === 0) {
			this._announcementElm.style.display = "none";
			this._active = false;
			return;
		}

		const announcement = this._announcements.shift();
		const htmls = this.getHtmls(announcement);
		this._mainAnnouncementElm.innerHTML = htmls.main;
		if (htmls.sub) {
			this._subAnnouncementElm.innerHTML = htmls.sub;
		}
		this._announcementElm.style.display = "block";
		this._active = true;

		let timeout;
		if (announcement.hasTtl()) {
			timeout = announcement.getTtl();
		} else {
			timeout = AnnouncementHandler._defaultTTL;
		}

		setTimeout(() => {
			this.popAnnouncement();
		}, timeout);
	}

	private getHtmls(announcement : UiMessage) : AnnouncementHTML {
		const type = announcement.getAnnouncementType()
		const names = announcement.getNamesOr([]);

		switch (type) {
		case AnnouncementType.LEVEL:
			if (names.length === 1) {
				return {
					main: "Welcome to " + names[0],
				};
			}
			break;
		case AnnouncementType.DISCONNECTED:
			return {
				main: "Lost connection to server",
				sub: "Please refresh the page",
			};
		case AnnouncementType.DISCONNECTED_SIGNALING:
			return {
				main: "Lost connection to signaling server",
				sub: "The game may still work, but no new players can connect",
			};
		case AnnouncementType.GAME_FINISH:
			if (names.length === 1) {
				return {
					main: names[0] + " wins the round!",
				};
			}
			break;
		case AnnouncementType.GAME_ERROR:
			if (names.length === 1) {
				return {
					main: "A game-ending error occurred",
					sub: names[0],
				};
			}
			break;
		}

		return {
			main: "Something bad happened",
			sub: "0x0" + type,
		};
	}
}