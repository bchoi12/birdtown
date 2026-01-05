
import { GameMode } from 'game/api'
import { FrequencyType } from 'game/entity/api'
import { LevelType, LevelLayout, LoadoutType, WeaponSetType, WinConditionType } from 'game/system/api'

import { Message, MessageBase, Descriptor, FieldDescriptor } from 'message'

import { StringFactory } from 'strings/string_factory'

enum GameConfigProp {
	UNKNOWN,

	BUFF_CRATE_SPAWN,
	DAMAGE_MULTIPLIER,
	DIFFICULTY,
	HEALTH_CRATE_SPAWN,
	LEVEL_LAYOUT,
	LEVEL_SEED,
	LEVEL_TYPE,
	LIVES,
	FRIENDLY_FIRE,
	PLAYERS_MIN,
	PLAYERS_MAX,
	POINTS,
	RESET_POINTS,
	SPAWN_TIME,
	STARTING_LOADOUT,
	TIME_SETUP,
	TIME_GAME,
	VICTORIES,
	WEAPON_SET,
	WEAPON_CRATE_SPAWN,
	WIN_CONDITION,
}

export class GameConfigMessage extends MessageBase<GameMode, GameConfigProp> implements Message<GameMode, GameConfigProp> {

	private static readonly _baseProps : [number, Descriptor][] = [
		[GameConfigProp.BUFF_CRATE_SPAWN, {}],
		[GameConfigProp.FRIENDLY_FIRE, {}],
		[GameConfigProp.HEALTH_CRATE_SPAWN, {}],
		[GameConfigProp.LEVEL_LAYOUT, {}],
		[GameConfigProp.LEVEL_SEED, {}],
		[GameConfigProp.LEVEL_TYPE, {}],
		[GameConfigProp.STARTING_LOADOUT, {}],
		[GameConfigProp.WEAPON_CRATE_SPAWN, {}],
		[GameConfigProp.WEAPON_SET, {}],
		[GameConfigProp.WIN_CONDITION, {}],
	];

	private static readonly _gameProps : [number, Descriptor][] = [
		...GameConfigMessage._baseProps,
		[GameConfigProp.DAMAGE_MULTIPLIER, { optional: true }],
		[GameConfigProp.PLAYERS_MIN, {}],
		[GameConfigProp.PLAYERS_MAX, { optional: true }],
		[GameConfigProp.SPAWN_TIME, { optional: true }],
		[GameConfigProp.RESET_POINTS, {}],
		[GameConfigProp.TIME_SETUP, {}],
	];

	private static readonly _messageDescriptor = new Map<GameMode, FieldDescriptor>([
		[GameMode.UNKNOWN, MessageBase.fieldDescriptor()],
		[GameMode.FREE, MessageBase.fieldDescriptor(
			...GameConfigMessage._baseProps,
		)],
		[GameMode.BUFF_BATTLE, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
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
		[GameMode.GOLDEN_GUN, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.POINTS, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
		// TODO: use _gameProps
		[GameMode.INVASION, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
		)],
		[GameMode.PRACTICE, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
		)],
		[GameMode.SPREE, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.POINTS, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
		[GameMode.SUDDEN_DEATH, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
		[GameMode.SURVIVAL, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
		[GameMode.TEAM_BATTLE, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
		[GameMode.TEAM_DEATHMATCH, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.POINTS, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
		[GameMode.VIP, MessageBase.fieldDescriptor(
			...GameConfigMessage._gameProps,
			[GameConfigProp.LIVES, {}],
			[GameConfigProp.TIME_GAME, { optional: true }],
			[GameConfigProp.VICTORIES, {}],
		)],
	]);

	// Do not call directly, use ConfigFactory
	constructor(mode : GameMode) {
		super(mode);

		this.resetToDefault(mode);
	}

	override debugName() : string { return "GameConfigMessage"; }
	override messageDescriptor() : Map<GameMode, FieldDescriptor> { return GameConfigMessage._messageDescriptor; }

	modeName() : string { return StringFactory.getModeName(this._type); }

	resetToDefault(mode : GameMode) : GameConfigMessage {
		this.reset(mode);

		if (mode === GameMode.UNKNOWN) {
			return this;
		}

		this.setWeaponSet(WeaponSetType.RECOMMENDED);

		if (mode === GameMode.FREE) {
			this.setFriendlyFire(false);
			this.setLevelType(LevelType.LOBBY);
			this.setLevelLayout(LevelLayout.CIRCLE);
			this.setLevelSeed(Math.floor(33 * Math.random()));
			this.setStartingLoadout(LoadoutType.RANDOM);
			this.setBuffCrateSpawn(FrequencyType.NEVER);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			this.setWinCondition(WinConditionType.NONE);
			return this;
		}

		this.setLevelType(LevelType.RANDOM);
		this.setLevelLayout(LevelLayout.NORMAL);
		this.setLevelSeed(Math.floor(100000 * Math.random()));

		this.setTimeSetup(25000);

		this.setFriendlyFire(false);
		this.setResetPoints(false);
		this.setBuffCrateSpawn(FrequencyType.NEVER);
		this.setHealthCrateSpawn(FrequencyType.NEVER);
		this.setWeaponCrateSpawn(FrequencyType.NEVER);

		switch (mode) {
		case GameMode.BUFF_BATTLE:
			this.setLives(1);
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setStartingLoadout(LoadoutType.BUFF);
			this.setTimeSetup(35000);
			this.setVictories(5);
			this.setWinCondition(WinConditionType.TEAM_LIVES);
			break;
		case GameMode.DUEL:
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.MIRROR);
			this.setLives(1);
			this.setStartingLoadout(LoadoutType.CHOOSE_TURNS);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.TEAM_LIVES);
			break;
		case GameMode.FREE_FOR_ALL:
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setBuffCrateSpawn(FrequencyType.RARE);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			this.setPoints(4);
			this.setStartingLoadout(LoadoutType.CHOOSE);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.POINTS);
			break;
		case GameMode.GOLDEN_GUN:
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setBuffCrateSpawn(FrequencyType.RARE);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setPoints(4);
			this.setStartingLoadout(LoadoutType.RANDOM);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.POINTS);
			break;
		case GameMode.INVASION:
			this.setPlayersMin(1);
			this.setBuffCrateSpawn(FrequencyType.RARE);
			this.setHealthCrateSpawn(FrequencyType.NEVER);
			this.setWeaponCrateSpawn(FrequencyType.NEVER);
			this.setLevelType(LevelType.BIRDTOWN);
			this.setLevelLayout(LevelLayout.INVASION);
			this.setLevelSeed(1);
			this.setStartingLoadout(LoadoutType.BUFF);
			this.setTimeSetup(35000);
			this.setWinCondition(WinConditionType.COOP);
			break;
		case GameMode.PRACTICE:
			this.setPlayersMin(1);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setTimeSetup(45000);
			this.setSpawnTime(15000);
			this.setStartingLoadout(LoadoutType.PICK);
			this.setBuffCrateSpawn(FrequencyType.UBIQUITOUS);
			this.setHealthCrateSpawn(FrequencyType.UBIQUITOUS);
			this.setWeaponCrateSpawn(FrequencyType.UBIQUITOUS);
			this.setWinCondition(WinConditionType.NONE);
			break;
		case GameMode.SPREE:
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.CIRCLE);
			this.setBuffCrateSpawn(FrequencyType.RARE);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			this.setPoints(4);
			this.setResetPoints(true);
			this.setStartingLoadout(LoadoutType.CHOOSE);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.POINTS);
			break;
		case GameMode.SUDDEN_DEATH:
			this.setLives(1);
			this.setPlayersMin(2);
			this.setDamageMultiplier(2);
			this.setLevelLayout(LevelLayout.TINY);
			this.setSpawnTime(3000);
			this.setStartingLoadout(LoadoutType.RANDOM);
			this.setBuffCrateSpawn(FrequencyType.LOW);
			this.setHealthCrateSpawn(FrequencyType.NEVER);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.LIVES);
			break;
		case GameMode.SURVIVAL:
			this.setLives(1);
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.CIRCLE);
			this.setStartingLoadout(LoadoutType.CHOOSE);
			this.setBuffCrateSpawn(FrequencyType.RARE);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.MEDIUM);
			this.setVictories(3);
			this.setWinCondition(WinConditionType.LIVES);
			break;
		case GameMode.TEAM_BATTLE:
			this.setLives(1);
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setBuffCrateSpawn(FrequencyType.RARE);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.LOW);
			this.setStartingLoadout(LoadoutType.CHOOSE);
			this.setVictories(4);
			this.setWinCondition(WinConditionType.TEAM_LIVES);
			break;
		case GameMode.TEAM_DEATHMATCH:
			this.setPoints(10);
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.CIRCLE);
			this.setBuffCrateSpawn(FrequencyType.RARE);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.LOW);
			this.setStartingLoadout(LoadoutType.CHOOSE);
			this.setVictories(4);
			this.setWinCondition(WinConditionType.TEAM_POINTS);
			break;
		case GameMode.VIP:
			this.setLives(1);
			this.setPlayersMin(2);
			this.setLevelLayout(LevelLayout.NORMAL);
			this.setBuffCrateSpawn(FrequencyType.RARE);
			this.setHealthCrateSpawn(FrequencyType.MEDIUM);
			this.setWeaponCrateSpawn(FrequencyType.LOW);
			this.setStartingLoadout(LoadoutType.CHOOSE);
			this.setVictories(4);
			this.setWinCondition(WinConditionType.TEAM_LIVES);
			break;			
		}
		return this;
	}

    // Begin auto-generated code (v2.1)
    override serializable() { return true; }

    hasBuffCrateSpawn() : boolean { return this.has(GameConfigProp.BUFF_CRATE_SPAWN); }
    getBuffCrateSpawn() : FrequencyType { return this.get<FrequencyType>(GameConfigProp.BUFF_CRATE_SPAWN); }
    getBuffCrateSpawnOr(value : FrequencyType) : FrequencyType { return this.getOr<FrequencyType>(GameConfigProp.BUFF_CRATE_SPAWN, value); }
    setBuffCrateSpawn(value : FrequencyType) : void { this.set<FrequencyType>(GameConfigProp.BUFF_CRATE_SPAWN, value); }

    hasDamageMultiplier() : boolean { return this.has(GameConfigProp.DAMAGE_MULTIPLIER); }
    getDamageMultiplier() : number { return this.get<number>(GameConfigProp.DAMAGE_MULTIPLIER); }
    getDamageMultiplierOr(value : number) : number { return this.getOr<number>(GameConfigProp.DAMAGE_MULTIPLIER, value); }
    setDamageMultiplier(value : number) : void { this.set<number>(GameConfigProp.DAMAGE_MULTIPLIER, value); }

    hasFriendlyFire() : boolean { return this.has(GameConfigProp.FRIENDLY_FIRE); }
    getFriendlyFire() : boolean { return this.get<boolean>(GameConfigProp.FRIENDLY_FIRE); }
    getFriendlyFireOr(value : boolean) : boolean { return this.getOr<boolean>(GameConfigProp.FRIENDLY_FIRE, value); }
    setFriendlyFire(value : boolean) : void { this.set<boolean>(GameConfigProp.FRIENDLY_FIRE, value); }

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

    hasSpawnTime() : boolean { return this.has(GameConfigProp.SPAWN_TIME); }
    getSpawnTime() : number { return this.get<number>(GameConfigProp.SPAWN_TIME); }
    getSpawnTimeOr(value : number) : number { return this.getOr<number>(GameConfigProp.SPAWN_TIME, value); }
    setSpawnTime(value : number) : void { this.set<number>(GameConfigProp.SPAWN_TIME, value); }

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

    hasVictories() : boolean { return this.has(GameConfigProp.VICTORIES); }
    getVictories() : number { return this.get<number>(GameConfigProp.VICTORIES); }
    getVictoriesOr(value : number) : number { return this.getOr<number>(GameConfigProp.VICTORIES, value); }
    setVictories(value : number) : void { this.set<number>(GameConfigProp.VICTORIES, value); }

    hasWeaponCrateSpawn() : boolean { return this.has(GameConfigProp.WEAPON_CRATE_SPAWN); }
    getWeaponCrateSpawn() : FrequencyType { return this.get<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN); }
    getWeaponCrateSpawnOr(value : FrequencyType) : FrequencyType { return this.getOr<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN, value); }
    setWeaponCrateSpawn(value : FrequencyType) : void { this.set<FrequencyType>(GameConfigProp.WEAPON_CRATE_SPAWN, value); }

    hasWeaponSet() : boolean { return this.has(GameConfigProp.WEAPON_SET); }
    getWeaponSet() : WeaponSetType { return this.get<WeaponSetType>(GameConfigProp.WEAPON_SET); }
    getWeaponSetOr(value : WeaponSetType) : WeaponSetType { return this.getOr<WeaponSetType>(GameConfigProp.WEAPON_SET, value); }
    setWeaponSet(value : WeaponSetType) : void { this.set<WeaponSetType>(GameConfigProp.WEAPON_SET, value); }

    hasWinCondition() : boolean { return this.has(GameConfigProp.WIN_CONDITION); }
    getWinCondition() : WinConditionType { return this.get<WinConditionType>(GameConfigProp.WIN_CONDITION); }
    getWinConditionOr(value : WinConditionType) : WinConditionType { return this.getOr<WinConditionType>(GameConfigProp.WIN_CONDITION, value); }
    setWinCondition(value : WinConditionType) : void { this.set<WinConditionType>(GameConfigProp.WIN_CONDITION, value); }

    /*
    const enumClass = "GameConfigProp";
    ["BUFF_CRATE_SPAWN", "FrequencyType"],
    ["DAMAGE_MULTIPLIER", "number"],
    ["FRIENDLY_FIRE", "boolean"],
    ["HEALTH_CRATE_SPAWN", "FrequencyType"],
    ["LEVEL_LAYOUT", "LevelLayout"],
    ["LEVEL_SEED", "number"],
    ["LEVEL_TYPE", "LevelType"],
    ["LIVES", "number"],
    ["PLAYERS_MIN", "number"],
    ["PLAYERS_MAX", "number"],
    ["POINTS", "number"],
    ["RESET_POINTS", "boolean"],
    ["SPAWN_TIME", "number"],
    ["STARTING_LOADOUT", "LoadoutType"],
    ["TIME_SETUP", "number"],
    ["TIME_GAME", "number"],
    ["VICTORIES", "number"],
    ["WEAPON_CRATE_SPAWN", "FrequencyType"],
    ["WEAPON_SET", "WeaponSetType"],
    ["WIN_CONDITION", "WinConditionType"],
    */
    // End auto-generated code (v2.1)
}