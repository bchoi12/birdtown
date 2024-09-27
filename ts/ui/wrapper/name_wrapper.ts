
import { game } from 'game'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class NameWrapper extends HtmlWrapper<HTMLElement> {

	constructor() {
		super(Html.span());

		this.elm().classList.add(Html.classDisplayName);
	}

	setClientId(clientId : number) : void {
		if (game.tablets().hasTablet(clientId)) {
			this.elm().style.backgroundColor = game.tablet(clientId).color();
			this.elm().textContent = game.tablet(clientId).displayName();
		} else {
			this.elm().textContent = "???";
		}
	}
}