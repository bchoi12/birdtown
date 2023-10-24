
import { Message, MessageBase, FieldDescriptor } from 'message'

export enum PlayerMessageType {
	UNKNOWN,
	LOADOUT,
}

enum PlayerProp {
	UNKNOWN,

	EQUIP_TYPE,
	ALT_EQUIP_TYPE,
	PLAYER_TYPE,
	VERSION,
}

export class PlayerMessage extends MessageBase<PlayerMessageType, PlayerProp> implements Message<PlayerMessageType, PlayerProp> {

	private static readonly _messageDescriptor = new Map<PlayerMessageType, FieldDescriptor>([
		[PlayerMessageType.LOADOUT, MessageBase.fieldDescriptor(
			[PlayerProp.PLAYER_TYPE, {}],
			[PlayerProp.EQUIP_TYPE, {optional: true}],
			[PlayerProp.ALT_EQUIP_TYPE, {optional: true}],
			[PlayerProp.VERSION, {}],
		)],
	]);

	constructor(type : PlayerMessageType) {
		super(type);
	}
	override messageDescriptor() : Map<PlayerMessageType, FieldDescriptor> { return PlayerMessage._messageDescriptor; }

	// Begin auto-generated code (v2.0)
	override serializable() { return true; }

	hasEquipType() : boolean { return this.has(PlayerProp.EQUIP_TYPE); }
	getEquipType() : number { return this.get<number>(PlayerProp.EQUIP_TYPE); }
	getEquipTypeOr(value : number) : number { return this.getOr<number>(PlayerProp.EQUIP_TYPE, value); }
	setEquipType(value : number) : void { this.set<number>(PlayerProp.EQUIP_TYPE, value); }

	hasAltEquipType() : boolean { return this.has(PlayerProp.ALT_EQUIP_TYPE); }
	getAltEquipType() : number { return this.get<number>(PlayerProp.ALT_EQUIP_TYPE); }
	getAltEquipTypeOr(value : number) : number { return this.getOr<number>(PlayerProp.ALT_EQUIP_TYPE, value); }
	setAltEquipType(value : number) : void { this.set<number>(PlayerProp.ALT_EQUIP_TYPE, value); }

	hasPlayerType() : boolean { return this.has(PlayerProp.PLAYER_TYPE); }
	getPlayerType() : number { return this.get<number>(PlayerProp.PLAYER_TYPE); }
	getPlayerTypeOr(value : number) : number { return this.getOr<number>(PlayerProp.PLAYER_TYPE, value); }
	setPlayerType(value : number) : void { this.set<number>(PlayerProp.PLAYER_TYPE, value); }

	hasVersion() : boolean { return this.has(PlayerProp.VERSION); }
	getVersion() : number { return this.get<number>(PlayerProp.VERSION); }
	getVersionOr(value : number) : number { return this.getOr<number>(PlayerProp.VERSION, value); }
	setVersion(value : number) : void { this.set<number>(PlayerProp.VERSION, value); }

	/*
	const enumClass = "PlayerProp";
	["EQUIP_TYPE", "number"]
	["ALT_EQUIP_TYPE", "number"]
	["PLAYER_TYPE", "number"]
	["VERSION", "number"]
	*/
	// End auto-generated code (v2.0)
}