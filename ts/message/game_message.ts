
import { Message, MessageBase, FieldDescriptor } from 'message'

export enum GameMessageType {
	UNKNOWN,

	NEW_CLIENT,
	DISCONNECT_CLIENT,

	LEVEL_LOAD,

	GAME_STATE,
}

export enum GameProp {
	UNKNOWN,
	CLIENT_ID,
	DISPLAY_NAME,
	SEED,
	STATE,
	TYPE,
	VERSION,
}

export class GameMessage extends MessageBase<GameMessageType, GameProp> implements Message<GameMessageType, GameProp> {

	private static readonly _messageDescriptor = new Map<GameMessageType, FieldDescriptor>([
		[GameMessageType.NEW_CLIENT, MessageBase.fieldDescriptor(
			[GameProp.CLIENT_ID, {}],
			[GameProp.DISPLAY_NAME, {}],
		)],
		[GameMessageType.DISCONNECT_CLIENT, MessageBase.fieldDescriptor(
			[GameProp.CLIENT_ID, {}],
		)],
		[GameMessageType.LEVEL_LOAD, MessageBase.fieldDescriptor(
			[GameProp.TYPE, {}],
			[GameProp.SEED, {}],
			[GameProp.VERSION, {}],
		)],
		[GameMessageType.GAME_STATE, MessageBase.fieldDescriptor(
			[GameProp.STATE, {}],
		)],
	]);

	constructor(type : GameMessageType) { super(type); }
	override messageDescriptor() : Map<GameMessageType, FieldDescriptor> { return GameMessage._messageDescriptor; }
}