
import { Message, MessageBase, FieldDescriptor } from 'message'

import { LevelType, PlayerRole } from 'game/system/api'

import { Box } from 'util/box'

export enum GameMessageType {
	UNKNOWN,

	CLIENT_JOIN,
	CLIENT_DISCONNECT,
	LEVEL_LOAD,
	GAME_STATE,
	PLAYER_STATE,
}

enum GameProp {
	UNKNOWN,

	CLIENT_ID,
	DISPLAY_NAME,
	GAME_STATE,
	LEVEL_BOUNDS,
	LEVEL_TYPE,
	LEVEL_SEED,
	LEVEL_VERSION,
	PLAYER_ROLE,
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
			[GameProp.LEVEL_BOUNDS, {}],
			[GameProp.LEVEL_SEED, {}],
			[GameProp.LEVEL_VERSION, { min: 1 }],
			[GameProp.DISPLAY_NAME, { optional: true }],
		)],
		[GameMessageType.GAME_STATE, MessageBase.fieldDescriptor(
			[GameProp.GAME_STATE, {}],
		)],
		[GameMessageType.PLAYER_STATE, MessageBase.fieldDescriptor(
			[GameProp.PLAYER_ROLE, {}],
			[GameProp.CLIENT_ID, {}],
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

    hasGameState() : boolean { return this.has(GameProp.GAME_STATE); }
    getGameState() : number { return this.get<number>(GameProp.GAME_STATE); }
    getGameStateOr(value : number) : number { return this.getOr<number>(GameProp.GAME_STATE, value); }
    setGameState(value : number) : void { this.set<number>(GameProp.GAME_STATE, value); }

    hasLevelBounds() : boolean { return this.has(GameProp.LEVEL_BOUNDS); }
    getLevelBounds() : Box { return this.get<Box>(GameProp.LEVEL_BOUNDS); }
    getLevelBoundsOr(value : Box) : Box { return this.getOr<Box>(GameProp.LEVEL_BOUNDS, value); }
    setLevelBounds(value : Box) : void { this.set<Box>(GameProp.LEVEL_BOUNDS, value); }

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

    hasPlayerRole() : boolean { return this.has(GameProp.PLAYER_ROLE); }
    getPlayerRole() : PlayerRole { return this.get<PlayerRole>(GameProp.PLAYER_ROLE); }
    getPlayerRoleOr(value : PlayerRole) : PlayerRole { return this.getOr<PlayerRole>(GameProp.PLAYER_ROLE, value); }
    setPlayerRole(value : PlayerRole) : void { this.set<PlayerRole>(GameProp.PLAYER_ROLE, value); }

    /*
    const enumClass = "GameProp";
    ["CLIENT_ID", "number"],
    ["DISPLAY_NAME", "string"],
    ["GAME_STATE", "number"],
    ["LEVEL_BOUNDS", "Box"],
    ["LEVEL_SEED", "number"],
    ["LEVEL_TYPE", "LevelType"],
    ["LEVEL_VERSION", "number"],
    ["PLAYER_ROLE", "PlayerRole"],
    */
    // End auto-generated code (v2.1)
}