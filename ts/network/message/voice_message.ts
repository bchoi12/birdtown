
import { Message, MessageType } from 'network/message'

enum Field {
	UNKNOWN,
	GAME_ID,
	ENABLED,
}

export class VoiceMessage implements Message {
	public readonly T = MessageType.VOICE;
	public D;

	private constructor(D : Object) {
		this.D = D;
	}

	static parse(msg : Message) : [VoiceMessage, boolean] {
		if (msg.T !== MessageType.VOICE) {
			return [null, false];
		}

		return [new VoiceMessage(msg.D), true];
	}

	static builder() : VoiceMessage {
		return new VoiceMessage({});
	}

	toMessage() : Message {
		return {
			T: this.T,
			D: this.D,
		};
	}

	gameId() : number { return this.D[Field.GAME_ID]; }
	setGameId(gameId : number) : VoiceMessage {
		this.D[Field.GAME_ID] = gameId;
		return this;
	}

	enabled() : boolean { return this.D[Field.ENABLED]; }
	setEnabled(enabled : boolean) : VoiceMessage {
		this.D[Field.ENABLED] = enabled;
		return this;
	}
}