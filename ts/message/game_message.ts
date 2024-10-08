
import { Message, MessageBase, FieldDescriptor } from 'message'

import { LevelType, LevelLayout, PlayerRole } from 'game/system/api'

import { AnnouncementType, FeedType } from 'ui/api'

import { Box } from 'util/box'

export enum GameMessageType {
	UNKNOWN,

	ANNOUNCEMENT,
	CLIENT_DISCONNECT,
    CLIENT_INIT,
	CLIENT_JOIN,
    FEED,
	LEVEL_LOAD,
	GAME_STATE,
}

enum GameProp {
	UNKNOWN,

	ANNOUNCEMENT_TYPE,
	CLIENT_ID,
	DISPLAY_NAME,
    FEED_TYPE,
	GAME_STATE,
	LEVEL_BOUNDS,
	LEVEL_LAYOUT,
	LEVEL_TYPE,
	LEVEL_SEED,
	LEVEL_VERSION,
	NAMES,
	TTL,
}

export class GameMessage extends MessageBase<GameMessageType, GameProp> implements Message<GameMessageType, GameProp> {

	private static readonly _messageDescriptor = new Map<GameMessageType, FieldDescriptor>([
		[GameMessageType.ANNOUNCEMENT, MessageBase.fieldDescriptor(
			[GameProp.ANNOUNCEMENT_TYPE, {}],
			[GameProp.NAMES, { optional: true }],
			[GameProp.TTL, { optional: true }],
		)],
		[GameMessageType.CLIENT_DISCONNECT, MessageBase.fieldDescriptor(
			[GameProp.CLIENT_ID, {}],
		)],
        [GameMessageType.CLIENT_INIT, MessageBase.fieldDescriptor(
            [GameProp.CLIENT_ID, {}],
            [GameProp.DISPLAY_NAME, {}],
        )],
		[GameMessageType.CLIENT_JOIN, MessageBase.fieldDescriptor(
			[GameProp.CLIENT_ID, {}],
		)],
        [GameMessageType.FEED, MessageBase.fieldDescriptor(
            [GameProp.FEED_TYPE, {}],
            [GameProp.NAMES, { optional: true }],
            [GameProp.TTL, { optional: true }],
        )],
		[GameMessageType.LEVEL_LOAD, MessageBase.fieldDescriptor(
			[GameProp.LEVEL_TYPE, { min: 1 }],
			[GameProp.LEVEL_BOUNDS, {}],
			[GameProp.LEVEL_LAYOUT, {}],
			[GameProp.LEVEL_SEED, {}],
			[GameProp.LEVEL_VERSION, { min: 1 }],
			[GameProp.DISPLAY_NAME, { optional: true }],
		)],
		[GameMessageType.GAME_STATE, MessageBase.fieldDescriptor(
			[GameProp.GAME_STATE, {}],
		)],
	]);

	constructor(type : GameMessageType) { super(type); }

	override debugName() : string { return "GameMessage"; }
	override messageDescriptor() : Map<GameMessageType, FieldDescriptor> { return GameMessage._messageDescriptor; }

    // Begin auto-generated code (v2.1)
    override serializable() { return true; }

    hasAnnouncementType() : boolean { return this.has(GameProp.ANNOUNCEMENT_TYPE); }
    getAnnouncementType() : AnnouncementType { return this.get<AnnouncementType>(GameProp.ANNOUNCEMENT_TYPE); }
    getAnnouncementTypeOr(value : AnnouncementType) : AnnouncementType { return this.getOr<AnnouncementType>(GameProp.ANNOUNCEMENT_TYPE, value); }
    setAnnouncementType(value : AnnouncementType) : void { this.set<AnnouncementType>(GameProp.ANNOUNCEMENT_TYPE, value); }

    hasClientId() : boolean { return this.has(GameProp.CLIENT_ID); }
    getClientId() : number { return this.get<number>(GameProp.CLIENT_ID); }
    getClientIdOr(value : number) : number { return this.getOr<number>(GameProp.CLIENT_ID, value); }
    setClientId(value : number) : void { this.set<number>(GameProp.CLIENT_ID, value); }

    hasDisplayName() : boolean { return this.has(GameProp.DISPLAY_NAME); }
    getDisplayName() : string { return this.get<string>(GameProp.DISPLAY_NAME); }
    getDisplayNameOr(value : string) : string { return this.getOr<string>(GameProp.DISPLAY_NAME, value); }
    setDisplayName(value : string) : void { this.set<string>(GameProp.DISPLAY_NAME, value); }

    hasFeedType() : boolean { return this.has(GameProp.FEED_TYPE); }
    getFeedType() : FeedType { return this.get<FeedType>(GameProp.FEED_TYPE); }
    getFeedTypeOr(value : FeedType) : FeedType { return this.getOr<FeedType>(GameProp.FEED_TYPE, value); }
    setFeedType(value : FeedType) : void { this.set<FeedType>(GameProp.FEED_TYPE, value); }

    hasGameState() : boolean { return this.has(GameProp.GAME_STATE); }
    getGameState() : number { return this.get<number>(GameProp.GAME_STATE); }
    getGameStateOr(value : number) : number { return this.getOr<number>(GameProp.GAME_STATE, value); }
    setGameState(value : number) : void { this.set<number>(GameProp.GAME_STATE, value); }

    hasLevelBounds() : boolean { return this.has(GameProp.LEVEL_BOUNDS); }
    getLevelBounds() : Box { return this.get<Box>(GameProp.LEVEL_BOUNDS); }
    getLevelBoundsOr(value : Box) : Box { return this.getOr<Box>(GameProp.LEVEL_BOUNDS, value); }
    setLevelBounds(value : Box) : void { this.set<Box>(GameProp.LEVEL_BOUNDS, value); }

    hasLevelLayout() : boolean { return this.has(GameProp.LEVEL_LAYOUT); }
    getLevelLayout() : LevelLayout { return this.get<LevelLayout>(GameProp.LEVEL_LAYOUT); }
    getLevelLayoutOr(value : LevelLayout) : LevelLayout { return this.getOr<LevelLayout>(GameProp.LEVEL_LAYOUT, value); }
    setLevelLayout(value : LevelLayout) : void { this.set<LevelLayout>(GameProp.LEVEL_LAYOUT, value); }

    hasLevelSeed() : boolean { return this.has(GameProp.LEVEL_SEED); }
    getLevelSeed() : number { return this.get<number>(GameProp.LEVEL_SEED); }
    getLevelSeedOr(value : number) : number { return this.getOr<number>(GameProp.LEVEL_SEED, value); }
    setLevelSeed(value : number) : void { this.set<number>(GameProp.LEVEL_SEED, value); }

    hasLevelType() : boolean { return this.has(GameProp.LEVEL_TYPE); }
    getLevelType() : LevelType { return this.get<LevelType>(GameProp.LEVEL_TYPE); }
    getLevelTypeOr(value : LevelType) : LevelType { return this.getOr<LevelType>(GameProp.LEVEL_TYPE, value); }
    setLevelType(value : LevelType) : void { this.set<LevelType>(GameProp.LEVEL_TYPE, value); }

    hasLevelVersion() : boolean { return this.has(GameProp.LEVEL_VERSION); }
    getLevelVersion() : number { return this.get<number>(GameProp.LEVEL_VERSION); }
    getLevelVersionOr(value : number) : number { return this.getOr<number>(GameProp.LEVEL_VERSION, value); }
    setLevelVersion(value : number) : void { this.set<number>(GameProp.LEVEL_VERSION, value); }

    hasNames() : boolean { return this.has(GameProp.NAMES); }
    getNames() : Array<string> { return this.get<Array<string>>(GameProp.NAMES); }
    getNamesOr(value : Array<string>) : Array<string> { return this.getOr<Array<string>>(GameProp.NAMES, value); }
    setNames(value : Array<string>) : void { this.set<Array<string>>(GameProp.NAMES, value); }

    hasTtl() : boolean { return this.has(GameProp.TTL); }
    getTtl() : number { return this.get<number>(GameProp.TTL); }
    getTtlOr(value : number) : number { return this.getOr<number>(GameProp.TTL, value); }
    setTtl(value : number) : void { this.set<number>(GameProp.TTL, value); }

    /*
    const enumClass = "GameProp";
    ["ANNOUNCEMENT_TYPE", "AnnouncementType"],
    ["CLIENT_ID", "number"],
    ["DISPLAY_NAME", "string"],
    ["FEED_TYPE", "FeedType"],
    ["GAME_STATE", "number"],
    ["LEVEL_BOUNDS", "Box"],
    ["LEVEL_LAYOUT", "LevelLayout"],
    ["LEVEL_SEED", "number"],
    ["LEVEL_TYPE", "LevelType"],
    ["LEVEL_VERSION", "number"],
    ["NAMES", "Array<string>"],
    ["TTL", "number"],
    */
    // End auto-generated code (v2.1)
}