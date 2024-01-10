
import { Message, MessageBase, FieldDescriptor } from 'message'

import { AnnouncementType, DialogType, TooltipType } from 'ui/api'

export enum UiMessageType {
	UNKNOWN,

	ANNOUNCEMENT,
	CLIENT_JOIN,
	CLIENT_DISCONNECT,
	DIALOG,
	TOOLTIP,
}

enum UiProp {
	UNKNOWN,
	ANNOUNCEMENT_TYPE,
	CLIENT_ID,
	DIALOG_TYPE,
	DISPLAY_NAME,
	NAMES,
	TOOLTIP_TYPE,
	TTL,
}

export class UiMessage extends MessageBase<UiMessageType, UiProp> implements Message<UiMessageType, UiProp> {

	private static readonly _messageDescriptor = new Map<UiMessageType, FieldDescriptor>([
		[UiMessageType.ANNOUNCEMENT, MessageBase.fieldDescriptor(
			[UiProp.ANNOUNCEMENT_TYPE, {}],
			[UiProp.TTL, {optional: true}],
			[UiProp.NAMES, {optional: true}],
		)],
		[UiMessageType.CLIENT_JOIN, MessageBase.fieldDescriptor(
			[UiProp.CLIENT_ID, {}],
			[UiProp.DISPLAY_NAME, {}],
		)],
		[UiMessageType.CLIENT_DISCONNECT, MessageBase.fieldDescriptor(
			[UiProp.CLIENT_ID, {}],
		)],
		[UiMessageType.DIALOG, MessageBase.fieldDescriptor(
			[UiProp.DIALOG_TYPE, {}],
		)],
		[UiMessageType.TOOLTIP, MessageBase.fieldDescriptor(
			[UiProp.TOOLTIP_TYPE, {}],
			[UiProp.TTL, {optional: true}],
			[UiProp.NAMES, {optional: true}],  // Array<string>
		)],
	]);

	constructor(type : UiMessageType) { super(type); }
	override messageDescriptor() : Map<UiMessageType, FieldDescriptor> { return UiMessage._messageDescriptor; }

    // Begin auto-generated code (v2.1)
    override serializable() { return true; }

    hasAnnouncementType() : boolean { return this.has(UiProp.ANNOUNCEMENT_TYPE); }
    getAnnouncementType() : AnnouncementType { return this.get<AnnouncementType>(UiProp.ANNOUNCEMENT_TYPE); }
    getAnnouncementTypeOr(value : AnnouncementType) : AnnouncementType { return this.getOr<AnnouncementType>(UiProp.ANNOUNCEMENT_TYPE, value); }
    setAnnouncementType(value : AnnouncementType) : void { this.set<AnnouncementType>(UiProp.ANNOUNCEMENT_TYPE, value); }

    hasClientId() : boolean { return this.has(UiProp.CLIENT_ID); }
    getClientId() : number { return this.get<number>(UiProp.CLIENT_ID); }
    getClientIdOr(value : number) : number { return this.getOr<number>(UiProp.CLIENT_ID, value); }
    setClientId(value : number) : void { this.set<number>(UiProp.CLIENT_ID, value); }

    hasDialogType() : boolean { return this.has(UiProp.DIALOG_TYPE); }
    getDialogType() : DialogType { return this.get<DialogType>(UiProp.DIALOG_TYPE); }
    getDialogTypeOr(value : DialogType) : DialogType { return this.getOr<DialogType>(UiProp.DIALOG_TYPE, value); }
    setDialogType(value : DialogType) : void { this.set<DialogType>(UiProp.DIALOG_TYPE, value); }

    hasDisplayName() : boolean { return this.has(UiProp.DISPLAY_NAME); }
    getDisplayName() : string { return this.get<string>(UiProp.DISPLAY_NAME); }
    getDisplayNameOr(value : string) : string { return this.getOr<string>(UiProp.DISPLAY_NAME, value); }
    setDisplayName(value : string) : void { this.set<string>(UiProp.DISPLAY_NAME, value); }

    hasNames() : boolean { return this.has(UiProp.NAMES); }
    getNames() : Array<string> { return this.get<Array<string>>(UiProp.NAMES); }
    getNamesOr(value : Array<string>) : Array<string> { return this.getOr<Array<string>>(UiProp.NAMES, value); }
    setNames(value : Array<string>) : void { this.set<Array<string>>(UiProp.NAMES, value); }

    hasTooltipType() : boolean { return this.has(UiProp.TOOLTIP_TYPE); }
    getTooltipType() : TooltipType { return this.get<TooltipType>(UiProp.TOOLTIP_TYPE); }
    getTooltipTypeOr(value : TooltipType) : TooltipType { return this.getOr<TooltipType>(UiProp.TOOLTIP_TYPE, value); }
    setTooltipType(value : TooltipType) : void { this.set<TooltipType>(UiProp.TOOLTIP_TYPE, value); }

    hasTtl() : boolean { return this.has(UiProp.TTL); }
    getTtl() : number { return this.get<number>(UiProp.TTL); }
    getTtlOr(value : number) : number { return this.getOr<number>(UiProp.TTL, value); }
    setTtl(value : number) : void { this.set<number>(UiProp.TTL, value); }

    /*
    const enumClass = "UiProp";
    ["ANNOUNCEMENT_TYPE", "AnnouncementType"],
    ["CLIENT_ID", "number"],
    ["DIALOG_TYPE", "DialogType"],
    ["DISPLAY_NAME", "string"],
    ["NAMES", "Array<string>"],
    ["TOOLTIP_TYPE", "TooltipType"],
    ["TTL", "number"],
    */
    // End auto-generated code (v2.1)
}