
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'
import { AnnouncementType, UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

import { defined } from 'util/common'

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

	setup() : void {}
	reset() : void { this._announcementElm.style.display = "none"; }
	setMode(mode : UiMode) : void {}

	handleMessage(msg : UiMessage) : void {
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
		this._mainAnnouncementElm.innerHTML = htmls[0];
		this._subAnnouncementElm.innerHTML = htmls[1];
		this._announcementElm.style.display = "block";
		this._active = true;

		let timeout;
		if (announcement.hasProp(UiProp.TTL)) {
			timeout = announcement.getProp<number>(UiProp.TTL);
		} else {
			timeout = AnnouncementHandler._defaultTTL;
		}

		setTimeout(() => {
			this.popAnnouncement();
		}, timeout);
	}

	private getHtmls(announcement : UiMessage) : Array<string> {
		switch (announcement.getProp<AnnouncementType>(UiProp.TYPE)) {
		default:
			return ["Welcome to birdtown", "This is a test announcement"];
		}
	}
}