
import { GameMode } from 'game/api'
import { FrequencyType } from 'game/entity/api'
import { LevelLayout, LevelType, LoadoutType, WinConditionType } from 'game/system/api'
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
	RESET_POINTS,
	STARTING_LOADOUT,
	TIME_SETUP,
	TIME_GAME,
	TIME_FINISH,
	TIME_VICTORY,
	TIME_ERROR,
	ROUND_WINS,
	WEAPON_CRATE_SPAWN,
	WIN_CONDITION,
}

export class GameConfigMessage extends MessageBase<GameMode, GameConfigProp> implements Message<GameMode, GameConfigProp> {

	private static readonly _modeNames = new Map<GameMode, string>([
		[GameMode.UNKNOWN, ""],
		[GameMode.FREE, "Free Play"],
		[GameMode.DUEL, "Duel"],
		[GameMode.FREE_FOR_ALL, "Free for All"],
		[GameMode.PRACTICE, "Practice Mode"],
		[GameMode.SPREE, "Spree"],
		[GameMode.SURVIVAL, "Survival"],
		[GameMode.TEAM_BATTLE, "Team Battle"],
	]);

	private static readonly _baseProps : [number, Descriptor][] = [
		[GameConfigProp.LEVEL_LAYOUT, {}],
		[GameConfigProp.LEVEL_SEED, {}],
		[GameConfigProp.LEVEL_TYPE, {}],
		[GameConfigProp.HEALTH_CRATE_SPAWN, {}],
		[GameConfigProp.STARTING_LOADOUT, {}],
		[GameConfigProp.WEAPON_CRATE_SPAWN, {}],
		[GameConfigProp.WIN_CONDITION, {}],
	];

	private static readonly _gameProps : [number, Descriptor][] = [
		...GameConfigMessage._baseProps,
		[GameConfigProp.PLAYERS_MIN, {}],
		[GameConfigProp.RESET_POINTS, {}],
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
			[GameConfigProp.PLAYERS_MAX, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.ROUND_WINS, {}],
		)],
		[GameMode.FREE_FOR_ALL, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.POINTS, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.ROUND_WINS, {}],
		)],
		[GameMode.PRACTICE, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
		)],
		[GameMode.SPREE, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.POINTS, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.ROUND_WINS, {}],
		)],
		[GameMode.SURVIVAL, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.ROUND_WINS, {}],
		)],
		[GameMode.TEAM_BATTLE, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.ROUND_WINS, {}],
		)],
	]);

	// Do not call directly, use ConfigFactory
	constructor(mode : GameMode) {
		super(mode);

		this.resetToDefault(mode);
	}

	override debugName() : string { return "GameConfigMessage"; }
	override messageDescriptor() : Map<GameMode, FieldDescriptor> { return GameConfigMessage._messageDescriptor; }

	modeName() : string { return GameConfigMessage._modeNames.has(this._type) ? GameConfigMessage._modeNames.get(this._type) : "Missing mode name!"; }

	resetToDefault(mode : GameMode) : GameConfigMessage {
		this.reset(mode);

		if (mode === GameMode.UNKNOWN) {
			return this;
		}

		if (mode === GameMode.FREE) {
			this.setLevelType(LevelType.LOBBY);
			this.setLevelLayout(LevelLayout.CIRCLE);
			this.setLevelSeed(Math.floor(33 * Math.random()));
			this.setStartingLoadout(LoadoutType.RANDOM);
			this.setHealthCrateSpawn(FrequencyType.HIGH);
			this.setWeaponCrateSpawn(FrequencyType.HIGH);
			this.setWinCondition(WinConditionType.NONE);
			return this;
		}

		this.setLevelType(LevelType.BIRDTOWN);
		this.setLevelLayout(LevelLayout.CIRCLE);
		this.setLevelSeed(Math.floor(100000 * Math.random()));

		this.setTimeSetup(25000);
		this.setTimeFinish(4000);
		this.setTimeVictory(8000);
		this.setTimeError(5000);

		this.setResetPoints(false);
		this.setHealthCrateSpawn(FrequencyType.NEVER);
		this.setWeaponCrateSpawn(FrequencyType.NEVER);

		switch (mode) {
		case GameMode.DUEL:
			this.setPlayersMin(2);
			this.setPlayersMax(2);
			this.setLevelType(LevelType.DUELTOWN);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setLives(1);
			this.setStartingLoadout(LoadoutType.PICK);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.TEAM_LIVES);
			break;
		case GameMode.FREE_FOR_ALL:
			this.setPlayersMin(2);
			this.setHealthCrateSpawn(FrequencyType.NEVER);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			this.setPoints(4);
			this.setStartingLoadout(LoadoutType.PICK);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.POINTS);
			break;
		case GameMode.PRACTICE:
			this.setPlayersMin(1);
			this.setTimeSetup(45000);
			this.setStartingLoadout(LoadoutType.PICK);
			this.setHealthCrateSpawn(FrequencyType.EVERYWHERE);
			this.setWeaponCrateSpawn(FrequencyType.EVERYWHERE);
			this.setWinCondition(WinConditionType.NONE);
			break;
		case GameMode.SPREE:
			this.setPlayersMin(2);
			this.setHealthCrateSpawn(FrequencyType.RARE);
			this.setWeaponCrateSpawn(FrequencyType.RARE);
			this.setPoints(3);
			this.setResetPoints(true);
			this.setStartingLoadout(LoadoutType.PICK);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.POINTS);
			break;
		case GameMode.SURVIVAL:
			this.setLives(1);
			this.setPlayersMin(2);
			this.setStartingLoadout(LoadoutType.PICK);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.NEVER);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.LIVES);
			break;
		case GameMode.TEAM_BATTLE:
			this.setLives(1);
			this.setPlayersMin(2);
			this.setLevelType(LevelType.BIRDTOWN);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.LOW);
			this.setStartingLoadout(LoadoutType.PICK);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.TEAM_LIVES);
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

    hasResetPoints() : boolean { return this.has(GameConfigProp.RESET_POINTS); }
    getResetPoints() : boolean { return this.get<boolean>(GameConfigProp.RESET_POINTS); }
    getResetPointsOr(value : boolean) : boolean { return this.getOr<boolean>(GameConfigProp.RESET_POINTS, value); }
    setResetPoints(value : boolean) : void { this.set<boolean>(GameConfigProp.RESET_POINTS, value); }

    hasStartingLoadout() : boolean { return this.has(GameConfigProp.STARTING_LOADOUT); }
    getStartingLoadout() : LoadoutType { return this.get<LoadoutType>(GameConfigProp.STARTING_LOADOUT); }
    getStartingLoadoutOr(value : LoadoutType) : LoadoutType { return this.getOr<LoadoutType>(GameConfigProp.STARTING_LOADOUT, value); }
    setStartingLoadout(value : LoadoutType) : void { this.set<LoadoutType>(GameConfigProp.STARTING_LOADOUT, value); }

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

    hasVictories() : boolean { return this.has(GameConfigProp.ROUND_WINS); }
    getVictories() : number { return this.get<number>(GameConfigProp.ROUND_WINS); }
    getVictoriesOr(value : number) : number { return this.getOr<number>(GameConfigProp.ROUND_WINS, value); }
    setVictories(value : number) : void { this.set<number>(GameConfigProp.ROUND_WINS, value); }

    hasWeaponCrateSpawn() : boolean { return this.has(GameConfigProp.WEAPON_CRATE_SPAWN); }
    getWeaponCrateSpawn() : FrequencyType { return this.get<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN); }
    getWeaponCrateSpawnOr(value : FrequencyType) : FrequencyType { return this.getOr<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN, value); }
    setWeaponCrateSpawn(value : FrequencyType) : void { this.set<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN, value); }

    hasWinCondition() : boolean { return this.has(GameConfigProp.WIN_CONDITION); }
    getWinCondition() : WinConditionType { return this.get<WinConditionType>(GameConfigProp.WIN_CONDITION); }
    getWinConditionOr(value : WinConditionType) : WinConditionType { return this.getOr<WinConditionType>(GameConfigProp.WIN_CONDITION, value); }
    setWinCondition(value : WinConditionType) : void { this.set<WinConditionType>(GameConfigProp.WIN_CONDITION, value); }

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
    ["RESET_POINTS", "boolean"],
    ["STARTING_LOADOUT", "LoadoutType"],
    ["TIME_SETUP", "number"],
    ["TIME_GAME", "number"],
    ["TIME_FINISH", "number"],
    ["TIME_VICTORY", "number"],
    ["TIME_ERROR", "number"],
    ["ROUND_WINS", "number"],
    ["WEAPON_CRATE_SPAWN", "FrequencyType"],
    ["WIN_CONDITION", "WinConditionType"],
    */
    // End auto-generated code (v2.1)
}