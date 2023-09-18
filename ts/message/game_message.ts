
import { Message, MessageBase, FieldDescriptor } from 'message'

export enum GameMessageType {
	UNKNOWN,

	CLIENT_JOIN,
	CLIENT_DISCONNECT,

	LEVEL_LOAD,

	GAME_STATE,
}

export enum GameProp {
	UNKNOWN,
	CLIENT_ID,
	DISPLAY_NAME,
	ROLE,
	SEED,
	STATE,
	TYPE,
	VERSION,
}

export class GameMessage extends MessageBase<GameMessageType, GameProp> implements Message<GameMessageType, GameProp> {

	private static readonly _messageDescriptor = new Map<GameMessageType, FieldDescriptor>([
		[GameMessageType.CLIENT_JOIN, MessageBase.fieldDescriptor(
			[GameProp.CLIENT_ID, {}],
			[GameProp.DISPLAY_NAME, {}],
		)],
		[GameMessageType.CLIENT_DISCONNECT, MessageBase.fieldDescriptor(
			[GameProp.CLIENT_ID, {}],
		)],
		[GameMessageType.LEVEL_LOAD, MessageBase.fieldDescriptor(
			[GameProp.TYPE, { min: 1 }],
			[GameProp.SEED, {}],
			[GameProp.VERSION, { min: 1 }],
			[GameProp.DISPLAY_NAME, { optional: true }],
		)],
		[GameMessageType.GAME_STATE, MessageBase.fieldDescriptor(
			[GameProp.STATE, {}],
		)],
	]);

	constructor(type : GameMessageType) { super(type); }
	override messageDescriptor() : Map<GameMessageType, FieldDescriptor> { return GameMessage._messageDescriptor; }
}