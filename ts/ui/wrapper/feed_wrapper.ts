
import { GameMessage } from 'message/game_message'

import { ui } from 'ui'
import { FeedType } from 'ui/api'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

export class FeedWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _iconMap = new Map<FeedType, IconType>([
		[FeedType.JOIN, IconType.PERSON_PLUS],
		[FeedType.KICK, IconType.KICK],
		[FeedType.KILL, IconType.SKILLET],
		[FeedType.LEAVE, IconType.PERSON_SLASH],
		[FeedType.ONE_MORE, IconType.ONE_MORE],
		[FeedType.READY, IconType.READY],
		[FeedType.SUICIDE, IconType.SKULL], 
	]);
	private static readonly _heightDelay = 500;

	private _visible : boolean;
	private _feedElm : HTMLElement;

	constructor(msg : GameMessage) {
		super(Html.div());

		this.elm().classList.add(Html.classNoSelect);
		this.elm().classList.add(Html.classFeed);

		this._visible = false;
		this._feedElm = Html.span();
		this._feedElm.classList.add(Html.classSpaced);

		let html = [];
		const names = msg.getNamesOr([]);
		if (names.length >= 1) {
			html.push(names[0]);
		}
		const type = msg.getFeedType();
		if (FeedWrapper._iconMap.has(type)) {
			let icon = Icon.create(FeedWrapper._iconMap.get(type));
			icon.style.padding = "0 0.2em";
			html.push(icon.outerHTML);
		}

		if (names.length >= 2) {
			html.push(names[1]);
		}

		if (html.length === 0) {
			console.error("Warning: empty feed published");
			html.push("?");
		}

		this._feedElm.innerHTML = html.join(" ");
		this.elm().appendChild(this._feedElm);

		this.setVisible(true);
	}

	visible() : boolean { return this._visible; }
	setVisible(visible : boolean, cb? : () => void) : void {
		if (this._visible === visible) {
			return;
		}

		this._visible = visible;

		if (this._visible) {
			this.elm().style.opacity = "1";
			this.elm().style.marginLeft = "0";
		} else {
			this.elm().style.opacity = "0";
			this.elm().style.marginLeft = "-120%";
		}

		setTimeout(() => {
			this.adjustHeight();
			if (cb) {
				setTimeout(() => {
					cb();
				}, FeedWrapper._heightDelay);
			}
		}, FeedWrapper._heightDelay);
	}

	private adjustHeight() : void {
		if (this._visible) {
			this.elm().style.height = "100%";
		} else {
			this.elm().style.height = "0";
		}
	}
}