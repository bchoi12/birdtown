
import { GameMode } from 'game/api'
import { Message, MessageBase, Descriptor, FieldDescriptor } from 'message'

enum GameConfigProp {
	UNKNOWN,
	PLAYERS_MIN,
	TIME_SETUP,
	TIME_GAME,
	TIME_FINISH,
	TIME_VICTORY,
	TIME_ERROR,
}

export class GameConfigMessage extends MessageBase<GameMode, GameConfigProp> implements Message<GameMode, GameConfigProp> {

	private static readonly _defaultProps : [number, Descriptor][] = [
		[GameConfigProp.PLAYERS_MIN, {}],
		[GameConfigProp.TIME_SETUP, {}],
		[GameConfigProp.TIME_FINISH, {}],
		[GameConfigProp.TIME_VICTORY, {}],
		[GameConfigProp.TIME_ERROR, {}]
	];

	private static readonly _messageDescriptor = new Map<GameMode, FieldDescriptor>([
		[GameMode.UNKNOWN, MessageBase.fieldDescriptor()],
		[GameMode.DUEL, MessageBase.fieldDescriptor(
			...GameConfigMessage._defaultProps,
			[GameConfigProp.TIME_GAME, { optional: true }],
		)],
		[GameMode.FREE_FOR_ALL, MessageBase.fieldDescriptor(
			...GameConfigMessage._defaultProps,
			[GameConfigProp.TIME_GAME, { optional: true }],
		)],
		[GameMode.PRACTICE, MessageBase.fieldDescriptor(
			...GameConfigMessage._defaultProps,
		)],
		[GameMode.SURVIVAL, MessageBase.fieldDescriptor(
			...GameConfigMessage._defaultProps,
			[GameConfigProp.TIME_GAME, { optional: true }],
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

		this.setTimeSetup(15000);
		this.setTimeFinish(3000);
		this.setTimeVictory(10000);
		this.setTimeError(5000);

		switch (mode) {
		case GameMode.DUEL:
			this.setPlayersMin(2);
			break;
		case GameMode.FREE_FOR_ALL:
			this.setPlayersMin(2);
			break;
		case GameMode.PRACTICE:
			this.setPlayersMin(1);
			break;
		case GameMode.SURVIVAL:
			this.setPlayersMin(2);
			break;
		}
		return this;
	}

    // Begin auto-generated code (v2.0)
    override serializable() { return true; }

    hasPlayersMin() : boolean { return this.has(GameConfigProp.PLAYERS_MIN); }
    getPlayersMin() : number { return this.get<number>(GameConfigProp.PLAYERS_MIN); }
    getPlayersMinOr(value : number) : number { return this.getOr<number>(GameConfigProp.PLAYERS_MIN, value); }
    setPlayersMin(value : number) : void { this.set<number>(GameConfigProp.PLAYERS_MIN, value); }

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

    /*
    const enumClass = "GameConfigProp";
    ["PLAYERS_MIN", "number"],
    ["TIME_SETUP", "number"],
    ["TIME_GAME", "number"],
    ["TIME_FINISH", "number"],
    ["TIME_VICTORY", "number"],
    ["TIME_ERROR", "number"],
    */
    // End auto-generated code (v2.0)
}