
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
			[PlayerProp.VERSION, {optional: true}],
		)],
	]);

	private _finalized : boolean;

	constructor(type : PlayerMessageType) {
		super(type);

		this._finalized = false;
	}
	override messageDescriptor() : Map<PlayerMessageType, FieldDescriptor> { return PlayerMessage._messageDescriptor; }

	finalized() : boolean { return this._finalized; }
	setFinalized(finalized : boolean) { this._finalized = finalized; }
}