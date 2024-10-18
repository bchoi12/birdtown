
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
	export function load(mode : GameMode) : GameConfigMessage {
		if (!configs.has(mode)) {
			configs.set(mode, new GameConfigMessage(mode));
		}

		let msg = empty();
		msg.copy(configs.get(mode));
		return msg;
	}
	export function save(msg : GameConfigMessage) : void {
		let msgCopy = empty();
		msgCopy.copy(msg);
		configs.set(msg.type(), msgCopy);
	}
}
