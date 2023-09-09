
import { Message, MessageBase, FieldDescriptor } from 'message'

export enum PlayerMessageType {
	UNKNOWN,

	LOADOUT,
}

export enum PlayerProp {
	UNKNOWN,

	EQUIP_TYPE,
	ALT_EQUIP_TYPE,
	TYPE,
	VERSION,
}

export class PlayerMessage extends MessageBase<PlayerMessageType, PlayerProp> implements Message<PlayerMessageType, PlayerProp> {

	private static readonly _messageDescriptor = new Map<PlayerMessageType, FieldDescriptor>([
		[PlayerMessageType.LOADOUT, MessageBase.fieldDescriptor(
			[PlayerProp.TYPE, {}],
			[PlayerProp.EQUIP_TYPE, {optional: true}],
			[PlayerProp.ALT_EQUIP_TYPE, {optional: true}],
			[PlayerProp.VERSION, {}],
		)],
	]);

	constructor(type : PlayerMessageType) {
		super(type);
	}
	override messageDescriptor() : Map<PlayerMessageType, FieldDescriptor> { return PlayerMessage._messageDescriptor; }
}