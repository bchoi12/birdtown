
import { Message, MessageBase, FieldDescriptor } from 'message'

import { DialogType } from 'ui/api'

enum DialogProp {
	UNKNOWN,

	ALT_EQUIP_TYPE,
    COLOR,
	DISPLAY_NAME,
	EQUIP_TYPE,
	PLAYER_TYPE,
	VERSION,
}

// Messages that store dialog output. These can originate from anywhere (host/client).
export class DialogMessage extends MessageBase<DialogType, DialogProp> implements Message<DialogType, DialogProp> {

	private static readonly _messageDescriptor = new Map<DialogType, FieldDescriptor>([
		[DialogType.INIT, MessageBase.fieldDescriptor(
            [DialogProp.COLOR, {}],
			[DialogProp.DISPLAY_NAME, {}],
            [DialogProp.VERSION, {}],
		)],
		[DialogType.LOADOUT, MessageBase.fieldDescriptor(
			[DialogProp.PLAYER_TYPE, {}],
			[DialogProp.EQUIP_TYPE, {optional: true}],
			[DialogProp.ALT_EQUIP_TYPE, {optional: true}],
			[DialogProp.VERSION, {}],
		)],
	]);

	constructor(type : DialogType) {
		super(type);
	}

	override debugName() : string { return "DialogMessage"; }
	override messageDescriptor() : Map<DialogType, FieldDescriptor> { return DialogMessage._messageDescriptor; }

    // Begin auto-generated code (v2.1)
    override serializable() { return true; }

    hasAltEquipType() : boolean { return this.has(DialogProp.ALT_EQUIP_TYPE); }
    getAltEquipType() : number { return this.get<number>(DialogProp.ALT_EQUIP_TYPE); }
    getAltEquipTypeOr(value : number) : number { return this.getOr<number>(DialogProp.ALT_EQUIP_TYPE, value); }
    setAltEquipType(value : number) : void { this.set<number>(DialogProp.ALT_EQUIP_TYPE, value); }

    hasColor() : boolean { return this.has(DialogProp.COLOR); }
    getColor() : string { return this.get<string>(DialogProp.COLOR); }
    getColorOr(value : string) : string { return this.getOr<string>(DialogProp.COLOR, value); }
    setColor(value : string) : void { this.set<string>(DialogProp.COLOR, value); }

    hasDisplayName() : boolean { return this.has(DialogProp.DISPLAY_NAME); }
    getDisplayName() : string { return this.get<string>(DialogProp.DISPLAY_NAME); }
    getDisplayNameOr(value : string) : string { return this.getOr<string>(DialogProp.DISPLAY_NAME, value); }
    setDisplayName(value : string) : void { this.set<string>(DialogProp.DISPLAY_NAME, value); }

    hasEquipType() : boolean { return this.has(DialogProp.EQUIP_TYPE); }
    getEquipType() : number { return this.get<number>(DialogProp.EQUIP_TYPE); }
    getEquipTypeOr(value : number) : number { return this.getOr<number>(DialogProp.EQUIP_TYPE, value); }
    setEquipType(value : number) : void { this.set<number>(DialogProp.EQUIP_TYPE, value); }

    hasPlayerType() : boolean { return this.has(DialogProp.PLAYER_TYPE); }
    getPlayerType() : number { return this.get<number>(DialogProp.PLAYER_TYPE); }
    getPlayerTypeOr(value : number) : number { return this.getOr<number>(DialogProp.PLAYER_TYPE, value); }
    setPlayerType(value : number) : void { this.set<number>(DialogProp.PLAYER_TYPE, value); }

    hasVersion() : boolean { return this.has(DialogProp.VERSION); }
    getVersion() : number { return this.get<number>(DialogProp.VERSION); }
    getVersionOr(value : number) : number { return this.getOr<number>(DialogProp.VERSION, value); }
    setVersion(value : number) : void { this.set<number>(DialogProp.VERSION, value); }

    /*
    const enumClass = "DialogProp";
    ["ALT_EQUIP_TYPE", "number"],
    ["COLOR", "string"],
    ["DISPLAY_NAME", "string"],
    ["EQUIP_TYPE", "number"],
    ["PLAYER_TYPE", "number"],
    ["VERSION", "number"],
    */
    // End auto-generated code (v2.1)
}