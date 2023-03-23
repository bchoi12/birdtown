
import { game } from 'game'

import { ui, HandlerType, Mode, NewClientMsg } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { Icon } from 'ui/util/icon'
import { ClientWrapper } from 'ui/wrapper/client_wrapper'
import { VoiceWrapper } from 'ui/wrapper/voice_wrapper'

// TODO: delete
import { ClientState } from 'game/system/client_state'

export class ClientsHandler extends HandlerBase implements Handler {

	private _clientsElm : HTMLElement;

	private _stream : MediaStream;
	private _voiceEnabled : boolean;

	constructor() {
		super(HandlerType.CLIENTS);

		this._clientsElm = Html.elm(Html.fieldsetClients);
	}

	setup() : void {}

	reset() : void {}

	setMode(mode : Mode) {}

	addStream(id : number, stream : MediaStream) : void {
		let audio = Html.audio();
		audio.autoplay = true;
		audio.srcObject = stream;
		audio.style.display = "none";

		let volumeRange = Html.range();
		volumeRange.min = "0";
		volumeRange.max = "100";
		volumeRange.value = "" + audio.volume * 100;
		volumeRange.onchange = () => {
			audio.volume = Number(volumeRange.value) / 100;
		};

		let muteButton = new HtmlWrapper(Html.span());
		if (audio.muted) {
			muteButton.elm().append(Icon.volumeX());
		} else {
			muteButton.elm().append(Icon.volumeHigh());
		}
		muteButton.elm().onclick = (e) => {
			audio.muted = !audio.muted;

			muteButton.removeChildren();
			if (audio.muted) {
				muteButton.elm().append(Icon.volumeX());
				volumeRange.style.visibility = "hidden";
			} else {
				muteButton.elm().append(Icon.volumeHigh());
				volumeRange.style.visibility = "visible";
			}
		}
		muteButton.elm().classList.add(Html.classTextButton);

		this._clientsElm.append(audio);
		this._clientsElm.append(muteButton.elm());
		this._clientsElm.append(volumeRange);
	}


	voiceEnabled() : boolean { return game.clientState().voiceEnabled(); }
	setVoiceEnabled(enabled : boolean) : void {
		if (this.voiceEnabled() === enabled) {
			return;
		}

		game.clientState().setVoiceEnabled(true);

		/*
		if (enabled) {
			navigator.mediaDevices.getUserMedia({
				audio: true,
			    video: false,
		    }).then((stream) => {
		    	this._stream = stream;
		      	this._stream.getTracks().forEach((track) => { track.enabled = true; });

		      	// TODO: connect to other clients here
		      	game.clientStates().executeCallback<ClientState>((clientState) => {
		      		if (clientState.voiceEnabled()) {
		      			console.log("Connect to", clientState.displayName());
		      		}
		      	});

		      	// TODO: toggle voice icon
		      	// TODO: add voice controls for all enabled clients

		      	game.clientState().setVoiceEnabled(true);
		    }).catch((e) => {
		    	console.error("Failed to enable voice chat:", e);
		    });
		} else {
			this._stream.getTracks().forEach((track) => { track.stop(); });

			// TODO: close voice connections here
			// TODO: hide voice controls for all clients

			game.clientState().setVoiceEnabled(false);
		}
		*/
	}

	onNewClient(msg : NewClientMsg) : void {
		const clientWrapper = new ClientWrapper(msg);
		this._clientsElm.appendChild(clientWrapper.elm());

		const voice = new VoiceWrapper(msg);
		this._clientsElm.appendChild(voice.elm());
	}
}