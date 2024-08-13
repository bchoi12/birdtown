
import { game } from 'game'

import { GameMessage } from 'message/game_message'

import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { VoiceControlsWrapper } from 'ui/wrapper/voice_controls_wrapper'

import { Optional } from 'util/optional'
import { Vec } from 'util/vector'

export class ClientWrapper extends HtmlWrapper<HTMLElement> {

	private _clientId : number;
	private _nameElm : HTMLElement;
	private _voiceControlsWrapper : Optional<VoiceControlsWrapper>;

	constructor(msg : GameMessage) {
		super(Html.div());

		this._clientId = msg.getClientId();

		this._nameElm = Html.span();
		this.setDisplayName(msg.getDisplayNameOr("unknown"));
		this.elm().appendChild(this._nameElm);

		this._voiceControlsWrapper = new Optional();
		if (this._clientId !== game.clientId()) {
			this._voiceControlsWrapper.set(new VoiceControlsWrapper());
			this.elm().appendChild(this._voiceControlsWrapper.get().elm());
		}

		if (game.isHost() && this._clientId !== game.clientId()) {
			let kickButton = new ButtonWrapper();
			kickButton.setIcon(IconType.KICK);
			kickButton.addOnClick(() => {
				game.netcode().kick(this._clientId);
			});

			this.elm().appendChild(kickButton.elm());
		}
	}

	setDisplayName(displayName : string) : void {this._nameElm.textContent = displayName; }
	displayName() : string { return this._nameElm.textContent; }

	addStream(stream : MediaStream) : void {
		if (this._voiceControlsWrapper.has()) {
			this._voiceControlsWrapper.get().enable(stream);
		}
	}

	removeStream() : void {
		if (this._voiceControlsWrapper.has()) {
			this._voiceControlsWrapper.get().disable();
		}
	}

	updatePos(pos : Vec) : void {
		if (this._voiceControlsWrapper.has()) {
			this._voiceControlsWrapper.get().updatePos(pos);
		}
	}
}