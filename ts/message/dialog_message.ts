
import { EntityType, BirdType } from 'game/entity/api'
import { BuffType } from 'game/factory/api'

import { Message, MessageBase, FieldDescriptor } from 'message'

import { DialogType } from 'ui/api'

enum DialogProp {
	UNKNOWN,

	ALT_EQUIP_TYPE,
    BIRD_TYPE,
    BUFF_TYPE,
    COLOR,
	DISPLAY_NAME,
	EQUIP_TYPE,
	VERSION,
}

// Messages that store dialog output. These can originate from anywhere (host/client).
export class DialogMessage extends MessageBase<DialogType, DialogProp> implements Message<DialogType, DialogProp> {

	private static readonly _messageDescriptor = new Map<DialogType, FieldDescriptor>([
        [DialogType.BUFF_INIT, MessageBase.fieldDescriptor(
            [DialogProp.VERSION, {}],
        )],
        [DialogType.BUFF_NORMAL, MessageBase.fieldDescriptor(
            [DialogProp.VERSION, {}],
        )],
        [DialogType.BUFF_BONUS, MessageBase.fieldDescriptor(
            [DialogProp.VERSION, {}],
        )],
        [DialogType.DISCONNECTED, MessageBase.fields()],
        [DialogType.FAILED_CONNECT, MessageBase.fields()],
        [DialogType.FAILED_COPY, MessageBase.fields()],
		[DialogType.INIT, MessageBase.fieldDescriptor(
            [DialogProp.BIRD_TYPE, {}],
            [DialogProp.COLOR, {}],
			[DialogProp.DISPLAY_NAME, {}],
            [DialogProp.VERSION, {}],
		)],
		[DialogType.LOADOUT, MessageBase.fieldDescriptor(
            [DialogProp.BUFF_TYPE, {optional: true}],
			[DialogProp.EQUIP_TYPE, {optional: true}],
			[DialogProp.ALT_EQUIP_TYPE, {optional: true}],
			[DialogProp.VERSION, {}],
		)],
        [DialogType.START_GAME, MessageBase.fields()],
        [DialogType.REMATCH, MessageBase.fields()],
        [DialogType.RESET_SETTINGS, MessageBase.fields()],
        [DialogType.RETURN_TO_LOBBY, MessageBase.fields()],
        [DialogType.QUERY_LOCATION, MessageBase.fields()],
        [DialogType.QUIT, MessageBase.fields()],
        [DialogType.VERSION_MISMATCH, MessageBase.fields()],
        [DialogType.YOUR_ROOM, MessageBase.fields()],
	]);

	constructor(type : DialogType) {
		super(type);

        this.setVersion(0);
	}

	override debugName() : string { return "DialogMessage"; }
	override messageDescriptor() : Map<DialogType, FieldDescriptor> { return DialogMessage._messageDescriptor; }

    // Begin auto-generated code (v2.1)
    override serializable() { return true; }

    hasAltEquipType() : boolean { return this.has(DialogProp.ALT_EQUIP_TYPE); }
    getAltEquipType() : EntityType { return this.get<EntityType>(DialogProp.ALT_EQUIP_TYPE); }
    getAltEquipTypeOr(value : EntityType) : EntityType { return this.getOr<EntityType>(DialogProp.ALT_EQUIP_TYPE, value); }
    setAltEquipType(value : EntityType) : void { this.set<EntityType>(DialogProp.ALT_EQUIP_TYPE, value); }

    hasBirdType() : boolean { return this.has(DialogProp.BIRD_TYPE); }
    getBirdType() : BirdType { return this.get<BirdType>(DialogProp.BIRD_TYPE); }
    getBirdTypeOr(value : BirdType) : BirdType { return this.getOr<BirdType>(DialogProp.BIRD_TYPE, value); }
    setBirdType(value : BirdType) : void { this.set<BirdType>(DialogProp.BIRD_TYPE, value); }

    hasBuffType() : boolean { return this.has(DialogProp.BUFF_TYPE); }
    getBuffType() : BuffType { return this.get<BuffType>(DialogProp.BUFF_TYPE); }
    getBuffTypeOr(value : BuffType) : BuffType { return this.getOr<BuffType>(DialogProp.BUFF_TYPE, value); }
    setBuffType(value : BuffType) : void { this.set<BuffType>(DialogProp.BUFF_TYPE, value); }

    hasColor() : boolean { return this.has(DialogProp.COLOR); }
    getColor() : string { return this.get<string>(DialogProp.COLOR); }
    getColorOr(value : string) : string { return this.getOr<string>(DialogProp.COLOR, value); }
    setColor(value : string) : void { this.set<string>(DialogProp.COLOR, value); }

    hasDisplayName() : boolean { return this.has(DialogProp.DISPLAY_NAME); }
    getDisplayName() : string { return this.get<string>(DialogProp.DISPLAY_NAME); }
    getDisplayNameOr(value : string) : string { return this.getOr<string>(DialogProp.DISPLAY_NAME, value); }
    setDisplayName(value : string) : void { this.set<string>(DialogProp.DISPLAY_NAME, value); }

    hasEquipType() : boolean { return this.has(DialogProp.EQUIP_TYPE); }
    getEquipType() : EntityType { return this.get<EntityType>(DialogProp.EQUIP_TYPE); }
    getEquipTypeOr(value : EntityType) : EntityType { return this.getOr<EntityType>(DialogProp.EQUIP_TYPE, value); }
    setEquipType(value : EntityType) : void { this.set<EntityType>(DialogProp.EQUIP_TYPE, value); }

    hasVersion() : boolean { return this.has(DialogProp.VERSION); }
    getVersion() : number { return this.get<number>(DialogProp.VERSION); }
    getVersionOr(value : number) : number { return this.getOr<number>(DialogProp.VERSION, value); }
    setVersion(value : number) : void { this.set<number>(DialogProp.VERSION, value); }

    /*
    const enumClass = "DialogProp";
    ["ALT_EQUIP_TYPE", "EntityType"],
    ["BIRD_TYPE", "BirdType"],
    ["BUFF_TYPE", "BuffType"],
    ["COLOR", "string"],
    ["DISPLAY_NAME", "string"],
    ["EQUIP_TYPE", "EntityType"],
    ["VERSION", "number"],
    */
    // End auto-generated code (v2.1)
}