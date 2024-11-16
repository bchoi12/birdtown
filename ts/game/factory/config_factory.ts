
import { game } from 'game'
import { GameMode } from 'game/api'
import { GameConfigMessage } from 'message/game_config_message'

export namespace ConfigFactory {

	const configs = new Map<GameMode, GameConfigMessage>();

	export function defaultConfig(mode : GameMode) : GameConfigMessage {
		return new GameConfigMessage(mode);
	}
	export function empty() : GameConfigMessage {
		return defaultConfig(GameMode.UNKNOWN);
	}
	export function loadRef(mode : GameMode) : GameConfigMessage {
		if (!configs.has(mode)) {
			configs.set(mode, new GameConfigMessage(mode));
		}
		return configs.get(mode);		
	}
	export function load(mode : GameMode) : GameConfigMessage {
		const config = loadRef(mode);

		let msg = empty();
		msg.copy(config);
		return msg;
	}
	export function save(msg : GameConfigMessage) : void {
		let msgCopy = empty();
		msgCopy.copy(msg);
		configs.set(msg.type(), msgCopy);
	}
}
