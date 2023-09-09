
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { VoiceWrapper } from 'ui/wrapper/voice_wrapper'

import { Vec } from 'util/vector'

export class ClientWrapper extends HtmlWrapper<HTMLElement> {

	private _nameElm : HTMLElement;
	private _voiceWrapper : VoiceWrapper;

	constructor(msg : UiMessage) {
		super(Html.div());

		this._nameElm = Html.span();
		this.setDisplayName(msg.getOr<string>(UiProp.DISPLAY_NAME, "unknown"));
		this.elm().appendChild(this._nameElm);

		this._voiceWrapper = new VoiceWrapper(msg);
		this.elm().appendChild(this._voiceWrapper.elm());
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