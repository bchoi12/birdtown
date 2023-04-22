
import { ui } from 'ui'
import { HandlerType, AnnouncementType, UiMode, AnnouncementMsg } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

import { defined } from 'util/common'

export class AnnouncementHandler extends HandlerBase implements Handler {

	private static readonly _defaultTTL : number = 3000;

	private _active : boolean;
	private _announcementElm : HTMLElement;
	private _mainAnnouncementElm : HTMLElement;
	private _subAnnouncementElm : HTMLElement;
	private _announcements : Array<AnnouncementMsg>;

	constructor() {
		super(HandlerType.ANNOUNCEMENT);

		this._active = false;
		this._announcementElm = Html.elm(Html.divAnnouncement);
		this._mainAnnouncementElm = Html.elm(Html.divMainAnnouncement);
		this._subAnnouncementElm = Html.elm(Html.divSubAnnouncement);
		this._announcements = new Array<AnnouncementMsg>();
	}

	setup() : void {}
	reset() : void { this._announcementElm.style.display = "none"; }
	setMode(mode : UiMode) : void {}

	showAnnouncement(announcement : AnnouncementMsg) : void {
		this._announcements.push(announcement);
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

		setTimeout(() => {
			this.popAnnouncement();
		}, defined(announcement.ttl) ? announcement.ttl : AnnouncementHandler._defaultTTL);
	}

	private getHtmls(announcement : AnnouncementMsg) : Array<string> {
		switch (announcement.type) {
		default:
			return ["Welcome to birdtown", "This is a test announcement"];
		}
	}
}