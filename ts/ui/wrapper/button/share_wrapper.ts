
import { game } from 'game'

import { Flags } from 'global/flags'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class ShareWrapper extends ButtonWrapper {

	private _onSuccess : () => void;
	private _onFail : () => void;

	constructor() {
		super();

		this.setIcon(IconType.SHARE);

		this._onSuccess = () => {
			ui.showTooltip(TooltipType.COPIED_URL, {
				ttl: 3000,
			});
		};
		this._onFail = () => {
			ui.pushDialog(DialogType.FAILED_COPY);
		}

		if (Flags.allowSharing.get()) {
			this.addOnClick(() => {
				navigator.clipboard.writeText(ui.getInviteLink()).then(this._onSuccess, this._onFail);
			});
		} else {
			this.setText(game.netcode().room());
		}
	}

	configureForDialog() : void {
		if (!Flags.allowSharing.get()) {
			return;
		}

		this.setText("Copy invite link");
		this.setHoverOnlyText(true);
		this.elm().style.float = "left";

		this._onSuccess = () => {
			this.setText("Copied!");
			this.setHoverOnlyText(false);
		}

		this._onFail = () => {
			this.setText("Failed to copy! Room: " + game.netcode().room());
			this.setHoverOnlyText(false);
		}
	}
}