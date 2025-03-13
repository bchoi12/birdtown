
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, ChatType } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

export class PhotoHandler extends HandlerBase implements Handler {

	private _canScreenshot : boolean;

	constructor() {
		super(HandlerType.PHOTO);

		this._canScreenshot = true;
	}

	override setup() : void {
		document.addEventListener("keydown", (e : any) => {
			if (this._canScreenshot && e.keyCode === settings.photoKeyCode) {
				const dataURL = game.canvas().toDataURL();
				const imgSrc = game.canvas().toDataURL("image/png");
				ui.chat(ChatType.PRINT, `<a href="${dataURL}" download><img class="screenshot" alt="screenshot" src="${imgSrc}" /></a>`);

				this._canScreenshot = false;
			}
		});

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode === settings.photoKeyCode) {
				this._canScreenshot = true;
			}
		});
	}
}