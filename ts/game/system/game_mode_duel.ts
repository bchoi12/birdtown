
import { SystemType } from 'game/system'
import { GameModeBase } from 'game/system/game_mode'

export class GameModeDuel extends GameModeBase {

	constructor() {
		super(SystemType.GAME_MODE_DUEL);
	}

}