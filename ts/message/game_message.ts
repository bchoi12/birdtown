
import { Message, MessageBase, FieldDescriptor } from 'message'

import { LevelType } from 'game/system/api'

export enum GameMessageType {
	UNKNOWN,

	CLIENT_JOIN,
	CLIENT_DISCONNECT,
	LEVEL_LOAD,
	GAME_STATE,
}

enum GameProp {
	UNKNOWN,
	CLIENT_ID,
	DISPLAY_NAME,
	LEVEL_TYPE,
	SEED,
	STATE,
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
			[GameProp.LEVEL_TYPE, { min: 1 }],
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

    // Begin auto-generated code (v2.1)
    override serializable() { return true; }

    hasClientId() : boolean { return this.has(GameProp.CLIENT_ID); }
    getClientId() : number { return this.get<number>(GameProp.CLIENT_ID); }
    getClientIdOr(value : number) : number { return this.getOr<number>(GameProp.CLIENT_ID, value); }
    setClientId(value : number) : void { this.set<number>(GameProp.CLIENT_ID, value); }

    hasDisplayName() : boolean { return this.has(GameProp.DISPLAY_NAME); }
    getDisplayName() : string { return this.get<string>(GameProp.DISPLAY_NAME); }
    getDisplayNameOr(value : string) : string { return this.getOr<string>(GameProp.DISPLAY_NAME, value); }
    setDisplayName(value : string) : void { this.set<string>(GameProp.DISPLAY_NAME, value); }

    hasSeed() : boolean { return this.has(GameProp.SEED); }
    getSeed() : number { return this.get<number>(GameProp.SEED); }
    getSeedOr(value : number) : number { return this.getOr<number>(GameProp.SEED, value); }
    setSeed(value : number) : void { this.set<number>(GameProp.SEED, value); }

    hasState() : boolean { return this.has(GameProp.STATE); }
    getState() : number { return this.get<number>(GameProp.STATE); }
    getStateOr(value : number) : number { return this.getOr<number>(GameProp.STATE, value); }
    setState(value : number) : void { this.set<number>(GameProp.STATE, value); }

    hasLevelType() : boolean { return this.has(GameProp.LEVEL_TYPE); }
    getLevelType() : LevelType { return this.get<LevelType>(GameProp.LEVEL_TYPE); }
    getLevelTypeOr(value : LevelType) : LevelType { return this.getOr<LevelType>(GameProp.LEVEL_TYPE, value); }
    setLevelType(value : LevelType) : void { this.set<LevelType>(GameProp.LEVEL_TYPE, value); }

    hasVersion() : boolean { return this.has(GameProp.VERSION); }
    getVersion() : number { return this.get<number>(GameProp.VERSION); }
    getVersionOr(value : number) : number { return this.getOr<number>(GameProp.VERSION, value); }
    setVersion(value : number) : void { this.set<number>(GameProp.VERSION, value); }

    /*
    const enumClass = "GameProp";
    ["CLIENT_ID", "number"],
    ["DISPLAY_NAME", "string"],
    ["SEED", "number"],
    ["STATE", "number"],
    ["LEVEL_TYPE", "LevelType"],
    ["VERSION", "number"],
    */
    // End auto-generated code (v2.1)
}