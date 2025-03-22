
import { game } from 'game'

import { Strings } from 'strings'

import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

export class NameWrapper extends HtmlWrapper<HTMLElement> {

	private _clientId : number;
	private _iconElm : HTMLElement;
	private _nameElm : HTMLElement;

	constructor() {
		super(Html.span());

		this.elm().classList.add(Html.classDisplayName);

		this._clientId = 0;
		this._iconElm = Html.span();
		this._nameElm = Html.span();

		this.elm().appendChild(this._iconElm);
		this.elm().appendChild(this._nameElm);
	}

	setClientId(clientId : number) : void {
		if (this._clientId === clientId) {
			return;
		}
		this._clientId = clientId;

		this.refresh();
	}
	clientId() : number { return this._clientId; }

	setEntityId(entityId : number) : void {
		const [entity, ok] = game.entities().getEntity(entityId);

		this._iconElm.innerHTML = "";
		if (!ok) {
			this._nameElm.textContent = "???";
		} else {
			this._nameElm.textContent = Strings.toTitleCase(entity.displayName());
		}
		this.elm().style.backgroundColor = "#888888";
	}

	refresh() : void {
		this._iconElm.innerHTML = "";
		if (this._clientId === game.clientId()) {
			let icon = Icon.create(IconType.PERSON);
			icon.style.padding = "0 0.3em 0.1em 0";
			this._iconElm.appendChild(icon);
		}

		if (game.tablets().hasTablet(this._clientId)) {
			this._nameElm.textContent = game.tablet(this._clientId).displayName();
		} else {
			this._nameElm.textContent = "???";
		}

		this.refreshColor();
	}

	refreshColor() : void {
		if (game.tablets().hasTablet(this._clientId)) {
			this.elm().style.backgroundColor = game.tablet(this._clientId).color();
		}
	}
}