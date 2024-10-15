
import { GameMode } from 'game/api'
import { FrequencyType } from 'game/entity/api'
import { LevelLayout, LevelType } from 'game/system/api'
import { Message, MessageBase, Descriptor, FieldDescriptor } from 'message'

enum GameConfigProp {
	UNKNOWN,
	LEVEL_LAYOUT,
	LEVEL_SEED,
	LEVEL_TYPE,
	LIVES,
	HEALTH_CRATE_SPAWN,
	PLAYERS_MIN,
	PLAYERS_MAX,
	POINTS,
	TIME_SETUP,
	TIME_GAME,
	TIME_FINISH,
	TIME_VICTORY,
	TIME_ERROR,
	VICTORIES,
	WEAPON_CRATE_SPAWN,
}

export class GameConfigMessage extends MessageBase<GameMode, GameConfigProp> implements Message<GameMode, GameConfigProp> {

	private static readonly _baseProps : [number, Descriptor][] = [
		[GameConfigProp.LEVEL_LAYOUT, {}],
		[GameConfigProp.LEVEL_SEED, {}],
		[GameConfigProp.LEVEL_TYPE, {}],
		[GameConfigProp.HEALTH_CRATE_SPAWN, {}],
		[GameConfigProp.WEAPON_CRATE_SPAWN, {}],
	];

	private static readonly _gameProps : [number, Descriptor][] = [
		...GameConfigMessage._baseProps,
		[GameConfigProp.PLAYERS_MIN, {}],
		[GameConfigProp.TIME_SETUP, {}],
		[GameConfigProp.TIME_FINISH, {}],
		[GameConfigProp.TIME_VICTORY, {}],
		[GameConfigProp.TIME_ERROR, {}],
	];

	private static readonly _messageDescriptor = new Map<GameMode, FieldDescriptor>([
		[GameMode.UNKNOWN, MessageBase.fieldDescriptor()],
		[GameMode.FREE, MessageBase.fieldDescriptor(
			...GameConfigMessage._baseProps,
		)],
		[GameMode.DUEL, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
		[GameMode.FREE_FOR_ALL, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.POINTS, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
		[GameMode.PRACTICE, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
		)],
		[GameMode.SURVIVAL, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
	]);

	private constructor(mode : GameMode) { super(mode); }

	override debugName() : string { return "GameConfigMessage"; }
	override messageDescriptor() : Map<GameMode, FieldDescriptor> { return GameConfigMessage._messageDescriptor; }

	static defaultConfig(mode : GameMode) : GameConfigMessage {
		let msg = new GameConfigMessage(mode);
		return msg.resetToDefault(mode);
	}
	resetToDefault(mode : GameMode) : GameConfigMessage {
		this.reset(mode);

		if (mode === GameMode.UNKNOWN) {
			return this;
		}

		if (mode === GameMode.FREE) {
			this.setLevelType(LevelType.LOBBY);
			this.setLevelLayout(LevelLayout.CIRCLE);
			this.setLevelSeed(Math.floor(33 * Math.random()));
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			return this;
		}

		this.setLevelType(LevelType.BIRDTOWN);
		this.setLevelLayout(LevelLayout.CIRCLE);
		this.setLevelSeed(Math.floor(100000 * Math.random()));

		this.setTimeSetup(15000);
		this.setTimeFinish(4000);
		this.setTimeVictory(8000);
		this.setTimeError(5000);

		this.setHealthCrateSpawn(FrequencyType.NEVER);
		this.setWeaponCrateSpawn(FrequencyType.NEVER);

		switch (mode) {
		case GameMode.DUEL:
			this.setPlayersMin(2);
			this.setLevelType(LevelType.DUELTOWN);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setLives(1);
			this.setVictories(3);
			break;
		case GameMode.FREE_FOR_ALL:
			this.setPlayersMin(2);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			this.setVictories(3);
			break;
		case GameMode.PRACTICE:
			this.setPlayersMin(1);
			this.setTimeSetup(Infinity);
			this.setHealthCrateSpawn(FrequencyType.HIGH);
			this.setWeaponCrateSpawn(FrequencyType.HIGH);
			break;
		case GameMode.SURVIVAL:
			this.setLives(1);
			this.setPlayersMin(2);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			this.setVictories(3);
			break;
		}
		return this;
	}

    // Begin auto-generated code (v2.1)
    override serializable() { return true; }

    hasHealthCrateSpawn() : boolean { return this.has(GameConfigProp.HEALTH_CRATE_SPAWN); }
    getHealthCrateSpawn() : FrequencyType { return this.get<FrequencyType>(GameConfigProp.HEALTH_CRATE_SPAWN); }
    getHealthCrateSpawnOr(value : FrequencyType) : FrequencyType { return this.getOr<FrequencyType>(GameConfigProp.HEALTH_CRATE_SPAWN, value); }
    setHealthCrateSpawn(value : FrequencyType) : void { this.set<FrequencyType>(GameConfigProp.HEALTH_CRATE_SPAWN, value); }

    hasLevelLayout() : boolean { return this.has(GameConfigProp.LEVEL_LAYOUT); }
    getLevelLayout() : LevelLayout { return this.get<LevelLayout>(GameConfigProp.LEVEL_LAYOUT); }
    getLevelLayoutOr(value : LevelLayout) : LevelLayout { return this.getOr<LevelLayout>(GameConfigProp.LEVEL_LAYOUT, value); }
    setLevelLayout(value : LevelLayout) : void { this.set<LevelLayout>(GameConfigProp.LEVEL_LAYOUT, value); }

    hasLevelSeed() : boolean { return this.has(GameConfigProp.LEVEL_SEED); }
    getLevelSeed() : number { return this.get<number>(GameConfigProp.LEVEL_SEED); }
    getLevelSeedOr(value : number) : number { return this.getOr<number>(GameConfigProp.LEVEL_SEED, value); }
    setLevelSeed(value : number) : void { this.set<number>(GameConfigProp.LEVEL_SEED, value); }

    hasLevelType() : boolean { return this.has(GameConfigProp.LEVEL_TYPE); }
    getLevelType() : LevelType { return this.get<LevelType>(GameConfigProp.LEVEL_TYPE); }
    getLevelTypeOr(value : LevelType) : LevelType { return this.getOr<LevelType>(GameConfigProp.LEVEL_TYPE, value); }
    setLevelType(value : LevelType) : void { this.set<LevelType>(GameConfigProp.LEVEL_TYPE, value); }

    hasLives() : boolean { return this.has(GameConfigProp.LIVES); }
    getLives() : number { return this.get<number>(GameConfigProp.LIVES); }
    getLivesOr(value : number) : number { return this.getOr<number>(GameConfigProp.LIVES, value); }
    setLives(value : number) : void { this.set<number>(GameConfigProp.LIVES, value); }

    hasPlayersMin() : boolean { return this.has(GameConfigProp.PLAYERS_MIN); }
    getPlayersMin() : number { return this.get<number>(GameConfigProp.PLAYERS_MIN); }
    getPlayersMinOr(value : number) : number { return this.getOr<number>(GameConfigProp.PLAYERS_MIN, value); }
    setPlayersMin(value : number) : void { this.set<number>(GameConfigProp.PLAYERS_MIN, value); }

    hasPlayersMax() : boolean { return this.has(GameConfigProp.PLAYERS_MAX); }
    getPlayersMax() : number { return this.get<number>(GameConfigProp.PLAYERS_MAX); }
    getPlayersMaxOr(value : number) : number { return this.getOr<number>(GameConfigProp.PLAYERS_MAX, value); }
    setPlayersMax(value : number) : void { this.set<number>(GameConfigProp.PLAYERS_MAX, value); }

    hasPoints() : boolean { return this.has(GameConfigProp.POINTS); }
    getPoints() : number { return this.get<number>(GameConfigProp.POINTS); }
    getPointsOr(value : number) : number { return this.getOr<number>(GameConfigProp.POINTS, value); }
    setPoints(value : number) : void { this.set<number>(GameConfigProp.POINTS, value); }

    hasTimeSetup() : boolean { return this.has(GameConfigProp.TIME_SETUP); }
    getTimeSetup() : number { return this.get<number>(GameConfigProp.TIME_SETUP); }
    getTimeSetupOr(value : number) : number { return this.getOr<number>(GameConfigProp.TIME_SETUP, value); }
    setTimeSetup(value : number) : void { this.set<number>(GameConfigProp.TIME_SETUP, value); }

    hasTimeGame() : boolean { return this.has(GameConfigProp.TIME_GAME); }
    getTimeGame() : number { return this.get<number>(GameConfigProp.TIME_GAME); }
    getTimeGameOr(value : number) : number { return this.getOr<number>(GameConfigProp.TIME_GAME, value); }
    setTimeGame(value : number) : void { this.set<number>(GameConfigProp.TIME_GAME, value); }

    hasTimeFinish() : boolean { return this.has(GameConfigProp.TIME_FINISH); }
    getTimeFinish() : number { return this.get<number>(GameConfigProp.TIME_FINISH); }
    getTimeFinishOr(value : number) : number { return this.getOr<number>(GameConfigProp.TIME_FINISH, value); }
    setTimeFinish(value : number) : void { this.set<number>(GameConfigProp.TIME_FINISH, value); }

    hasTimeVictory() : boolean { return this.has(GameConfigProp.TIME_VICTORY); }
    getTimeVictory() : number { return this.get<number>(GameConfigProp.TIME_VICTORY); }
    getTimeVictoryOr(value : number) : number { return this.getOr<number>(GameConfigProp.TIME_VICTORY, value); }
    setTimeVictory(value : number) : void { this.set<number>(GameConfigProp.TIME_VICTORY, value); }

    hasTimeError() : boolean { return this.has(GameConfigProp.TIME_ERROR); }
    getTimeError() : number { return this.get<number>(GameConfigProp.TIME_ERROR); }
    getTimeErrorOr(value : number) : number { return this.getOr<number>(GameConfigProp.TIME_ERROR, value); }
    setTimeError(value : number) : void { this.set<number>(GameConfigProp.TIME_ERROR, value); }

    hasVictories() : boolean { return this.has(GameConfigProp.VICTORIES); }
    getVictories() : number { return this.get<number>(GameConfigProp.VICTORIES); }
    getVictoriesOr(value : number) : number { return this.getOr<number>(GameConfigProp.VICTORIES, value); }
    setVictories(value : number) : void { this.set<number>(GameConfigProp.VICTORIES, value); }

    hasWeaponCrateSpawn() : boolean { return this.has(GameConfigProp.WEAPON_CRATE_SPAWN); }
    getWeaponCrateSpawn() : FrequencyType { return this.get<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN); }
    getWeaponCrateSpawnOr(value : FrequencyType) : FrequencyType { return this.getOr<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN, value); }
    setWeaponCrateSpawn(value : FrequencyType) : void { this.set<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN, value); }

    /*
    const enumClass = "GameConfigProp";
    ["HEALTH_CRATE_SPAWN", "FrequencyType"],
    ["LEVEL_LAYOUT", "LevelLayout"],
    ["LEVEL_SEED", "number"],
    ["LEVEL_TYPE", "LevelType"],
    ["LIVES", "number"],
    ["PLAYERS_MIN", "number"],
    ["PLAYERS_MAX", "number"],
    ["POINTS", "number"],
    ["TIME_SETUP", "number"],
    ["TIME_GAME", "number"],
    ["TIME_FINISH", "number"],
    ["TIME_VICTORY", "number"],
    ["TIME_ERROR", "number"],
    ["VICTORIES", "number"],
    ["WEAPON_CRATE_SPAWN", "FrequencyType"],
    */
    // End auto-generated code (v2.1)
}