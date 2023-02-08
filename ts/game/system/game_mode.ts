
import { System, SystemBase, SystemType } from 'game/system'

export abstract class GameModeBase extends SystemBase implements System {
	constructor(type : SystemType) {
		super(type);
	}
}