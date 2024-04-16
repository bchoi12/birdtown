
import { game } from 'game'

import { UiMessage } from 'message/ui_message'

import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { VoiceWrapper } from 'ui/wrapper/voice_wrapper'

import { Vec } from 'util/vector'

export class ClientWrapper extends HtmlWrapper<HTMLElement> {

	private _clientId : number;
	private _nameElm : HTMLElement;
	private _voiceWrapper : VoiceWrapper;

	constructor(msg : UiMessage) {
		super(Html.div());

		this._clientId = msg.getClientId();

		this._nameElm = Html.span();
		this.setDisplayName(msg.getDisplayNameOr("unknown"));
		this.elm().appendChild(this._nameElm);

		this._voiceWrapper = new VoiceWrapper(/*self=*/this._clientId === game.clientId());
		this.elm().appendChild(this._voiceWrapper.elm());

		if (game.isHost() && this._clientId !== game.clientId()) {
			let kickButton = Html.span();
			kickButton.append(Icon.create(IconType.KICK));
			kickButton.classList.add(Html.classButton);

			kickButton.onclick = (e) => {
				e.stopPropagation();

				game.netcode().kick(this._clientId);
			}

			this.elm().appendChild(kickButton);
		}
	}

	setDisplayName(displayName : string) : void {this._nameElm.textContent = displayName; }
	displayName() : string { return this._nameElm.textContent; }

	addStream(stream : MediaStream) : void {
		this._voiceWrapper.enable(stream);
	}

	removeStream() : void {
		this._voiceWrapper.disable();
	}

	updatePos(pos : Vec) : void {
		this._voiceWrapper.updatePos(pos);
	}
}