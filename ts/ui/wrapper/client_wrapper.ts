
import { NewClientMsg } from 'ui/api'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { VoiceWrapper } from 'ui/wrapper/voice_wrapper'

export class ClientWrapper extends HtmlWrapper {

	private _voiceWrapper : VoiceWrapper;

	constructor(msg : NewClientMsg) {
		super(Html.div());

		this.elm().textContent = msg.displayName;

		this._voiceWrapper = new VoiceWrapper(msg);
		this.elm().appendChild(this._voiceWrapper.elm());
	}

	addStream(stream : MediaStream) : void {
		this._voiceWrapper.enable(stream);
	}

	removeStream() : void {
		this._voiceWrapper.disable();
	}
}