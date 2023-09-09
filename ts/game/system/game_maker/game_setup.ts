
import { GameMode } from 'game/api'

export type GameConfig = {
	
}

export class GameSetup {

	private static readonly _defaultConfigs : Map<GameMode, GameConfig> = new Map([
		[GameMode.DUEL, {}],
		[GameMode.FREE_FOR_ALL, {}],
	]);

	private _mode : GameMode;
	private _config : GameConfig;

	constructor() {
		this._mode = GameMode.UNKNOWN;
		this._config = {};
	}

	reset() : void {
		this._mode = GameMode.UNKNOWN;
		this._config = {};
	}

	mode() : GameMode { return this._mode; }
	config() : GameConfig { return this._config; }

	setMode(mode : GameMode, overrides : GameConfig) : void {
		if (!GameSetup._defaultConfigs.has(mode)) {
			console.error("Error: no default config specified for %s", GameMode[mode]);
			return;
		}

		this._mode = mode;
		this._config = {...GameSetup._defaultConfigs.get(mode), ...overrides};
	}
}