
import { GameMode } from 'game/api'
import { Message, MessageBase, Descriptor, FieldDescriptor } from 'message'

export enum GameConfigProp {
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
	]);

	private constructor(mode : GameMode) { super(mode); }
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

		this.set<number>(GameConfigProp.TIME_SETUP, 15 * 1000);
		this.set<number>(GameConfigProp.TIME_FINISH, 3000);
		this.set<number>(GameConfigProp.TIME_VICTORY, 10000);
		this.set<number>(GameConfigProp.TIME_ERROR, 5000);

		switch (mode) {
		case GameMode.DUEL:
			this.set<number>(GameConfigProp.PLAYERS_MIN, 2);
			break;
		case GameMode.FREE_FOR_ALL:
			this.set<number>(GameConfigProp.PLAYERS_MIN, 2);
			break;
		}
		return this;
	}
}