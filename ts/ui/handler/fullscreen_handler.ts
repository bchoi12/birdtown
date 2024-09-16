
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

export class FullscreenHandler extends HandlerBase implements Handler {

	constructor() {
		super(HandlerType.FULLSCREEN);
	}

	override setup() : void {
		document.addEventListener("fullscreenchange", (e: any) => {
			if (ui.mode() !== UiMode.GAME) { return; }

			console.log(e);

			if (settings.fullscreen() && !document.fullscreenElement) {
				ui.openMenu();
			}
		});
	}

	isFullscreen() : boolean { return window.innerHeight === screen.height; }

	applyFullscreen() : void {
		if (!document.hasFocus() || !game.initialized()) {
			return;
		}

		if (settings.fullscreen()) {
			if (!this.isFullscreen()) {
				document.documentElement.requestFullscreen();
			}
		} else if (this.isFullscreen()) {
			document.exitFullscreen();
		}
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		this.applyFullscreen();
	}
}